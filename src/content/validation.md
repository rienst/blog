---
slug: '/validation'
date: '2026-10-11'
title: 'Validation'
---

Validation

This HTTP endpoint allows clients to submit orders to a webshop:

```cs
app.MapPost("/orders", async (
    SubmitOrderBody body,
    IValidator<SubmitOrderBody> validator,
    IOrderService orderService) =>
{
    var validation = validator.Validate(body);

    if (!validation.IsValid)
    {
        return Results.ValidationProblem(validation.ToDictionary());
    }

    var order = new Order();

    await orderService.SubmitOrder(order);

    return Results.Accepted();
});
```

Validation is implemented using FluentValidation.

```cs
RuleFor(x => x.OrderLines)
		.Must(lines => lines.Sum(l => l.Quantity) <= 100)
		.WithMessage("An order cannot contain more than 100 items in total.");
```

This setup provides rich validation responses back to the caller:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "OrderLines": ["An order cannot contain more than 100 items in total."]
  }
}
```

Validation might seem like a simple concept:

- You receive a request
- You validate it
- You process it

When you write the code this setup looks fine, but it violates the principle of **encapsulation**:

> Bundle data together with the rules that apply to it in a way that makes it impossible to use the data without obeying those rules.
