---
slug: '/validation'
date: '2026-10-11'
title: 'Validation'
---

This is a REST API handler for placing orders in a webshop:

```cs
app.MapPost("/orders", async (
    SubmitOrderRequest request,
    IValidator<SubmitOrderRequest> validator,
    IOrderService orderService) =>
{
    var validation = validator.Validate(request);

    if (!validation.IsValid)
    {
        return Results.ValidationProblem(validation.ToDictionary());
    }

    await orderService.SubmitOrder(request);

    return Results.Accepted();
});
```

It does two main things:

1. It validates the request body.
2. If it's valid, it hands the request over to `IOrderService` for processing.

This system is bulletproof:

You want to place an order? You need to call the `POST /orders` endpoint. And calling the endpoint means you need to make it through the `validator.Validate(request)`.

**But this system is only bulletproof for now.**

What if someone:

- Adds a `POST /admin/orders` endpoint for admins to place orders on behalf of customers?
- Creates a subscription feature that creates orders for customers on a schedule?
- Builds an entire GraphQL API to our backend and allow orders to be placed from there as well?

The core problem is that the logic is separated from the data. The data lives in `SubmitOrderRequest` but the rules live in the `IValidator<SubmitOrderRequest>` implementation.

That makes it possible for future developers (including yourself) to create a `SubmitOrderRequest` without applying the validation rules. As a result, when you see a `SubmitOrderRequest` anywhere in the codebase **you have no idea if it's actually valid or not**.

## Encapsulation

This comes down to a violation of the principle of **encapsulation**:

> Bundle the data with the related logic so that you can only work with the data in a way that satisfies the rules of the data.

Let’s look at `DateTimeOffset` as an example. We don’t know how the class stores the data exactly, we can only work with it through the constructors and methods the class provides. Its rules are **encapsulated** in the class itself.

You can’t instantiate an invalid `DateTimeOffset`:

```cs
DateTimeOffset.Parse("next week")
// throws FormatException – "next week" isn’t a date

new DateTimeOffset(2026, 2, 30, 0, 0, 0, TimeSpan.Zero);
// throws ArgumentOutOfRangeException — February 30th doesn't exist:
```

That means you can just ask for a `DateTimeOffset` and know that the data is valid:

```cs
class MyLogger
{
	void LogEvent(DateTimeOffset timestamp, string summary);
}
```

Imagine if we had to check for these things every time we work with a `DateTimeOffset`:

```cs
class MyLogger
{
	void LogEvent(DateTimeOffset timestamp, string summary)
	{
		if (timestamp.Month == 2 && timestamp.Day == 30)
		{
			throw new ArgumentException("February 30th doesn't exist.", nameof(timestamp));
		}

		// Do the actual logging
	}
}
```

This is why validation can get awkward very quickly. The calling code doesn't know whether or not the data is valid and has to check for itself to make sure.

Let’s go back to our controller and look at the `IValidator<SubmitOrderBody>`. It uses the FluentValidation library and it checks if an order contains more than 100 lines, because the business doesn’t allow that.

```cs
RuleFor(x => x.OrderLines)
    .Must(lines => lines.Sum(l => l.Quantity) <= 100)
    .WithMessage("An order cannot contain more than 100 items in total.");
```
