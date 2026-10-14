---
slug: '/validation'
date: '2026-10-12'
title: 'Input validation'
---

This is an endpoint for placing orders in a webshop:

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

It validates the user input (`SubmitOrderRequeat`) and then sends it off to the order service. The only way to place an order is through this `POST /orders` handler which means every request has to get past the validator first.

The problem is that this violates the principle of encapsulation: Hide data in classes and write methods that restrict how that data can be used. Instead, the data lives in `SubmitOrderRequest` and the rules are applied via the validator. Nothing is preventing unvalidated requests from being sent to `SubmitOrder`.

If you don't want to allow something to be in a certain state then you should make it impossible for that thing to get in that state. `DateTimeOffset` class. You can't create an instance of it that's in an invalid state:

```cs
DateTimeOffset.Parse("next week");
// Throws FormatException

new DateTimeOffset(2026, 2, 30, 0, 0, 0, TimeSpan.Zero);
// Throws ArgumentOutOfRangeException: February 30th doesn't exist
```

So `DateTimeOffset` always represents a **valid** point in time. Any method that accepts one can trust it:

```cs
void LogEvent(DateTimeOffset timestamp, string eventSummary);
```

This method doesn't have to worry abouth whether or not the timestamp represents February 30th. The type itself guarantees that it does not. Our `SubmitOrderRequest` doesn't provide such guarantees, so everything that touches it has to remember to use the validator first.

## Turning the validator into a model

Here's the validator behind our endpoint:

```cs
public class SubmitOrderRequestValidator : AbstractValidator<SubmitOrderRequest>
{
	public SubmitOrderRequestValidator()
	{
		RuleFor(x => x.ShippingAddress)
			.MaximumLength(200);

		RuleFor(x => x.OrderLines)
			.Must(lines => lines.Sum(l => l.Quantity) <= 100)
			.WithMessage("An order cannot contain more than 100 items in total.");
	}
}
```

These two rules apply to specific pieces of data inside of `SubmitOrderRequest`. We should move them closer to that data.

### The shipping address

The address rule only cares about the address, so a `ShippingAddress` record can combine the data and the rule:

```cs
public record ShippingAddress
{
	private const int MaxLength = 200;

	public string Value { get; }

	public ShippingAddress(string value)
	{
		if (value.Length > MaxLength)
		{
			throw new DomainException(
				$"Shipping address cannot exceed {MaxLength} characters.");
		}

		Value = value;
	}

	public override string ToString() => Value;
}
```

(`DomainException` is a plain exception type of our own. More on it below.)

There's now no way to get a `ShippingAddress` that breaks the rule. Anyone can just use it and trust that the data is valid.

### The order lines

The quantity rule applies to a larger chunk of data. No single `OrderLine` knows the total amount of items across all order lines, so the rule has to live one level up, in whatever owns the lines. That's the order.

`SubmitOrderRequest` is just the shape of incoming JSON. Let's not build rules in there. The thing the business actually cares about is an `Order`, and it should be impossible to construct a broken one:

```cs
public class Order
{
	private const int MaxTotalQuantity = 100;

	private readonly List<OrderLine> _orderLines;

	public ShippingAddress ShippingAddress { get; private set; }
	public IReadOnlyList<OrderLine> OrderLines => _orderLines.AsReadOnly();

	public Order(ShippingAddress shippingAddress, IEnumerable<OrderLine> orderLines)
	{
		var lines = orderLines.ToList();

		EnsureWithinLimit(lines);

		ShippingAddress = shippingAddress;
		_orderLines = lines;
	}

	public void AddLine(OrderLine line)
	{
		EnsureWithinLimit(_orderLines.Append(line));
		_orderLines.Add(line);
	}

	public void ChangeShippingAddress(ShippingAddress address) => ShippingAddress = address;

	private static void EnsureWithinLimit(IEnumerable<OrderLine> lines)
	{
		if (lines.Sum(l => l.Quantity) > MaxTotalQuantity)
		{
			throw new DomainException(
				$"An order cannot contain more than {MaxTotalQuantity} items in total.");
		}
	}
}
```

The limit is checked in the constructor and in `AddLine`, so an order can't start over the limit or grow past it.

Notice that we now see the benefit of the `ShippingAddress` record as well. No need to worry about that piece of data here in the `Order` class. If the address limit changes, `Order` doesn't change. Each type guards its own piece of data. We're essentially building a set of small concepts that together form a domain model which we can extend and build upon.

## The simplified endpoint

The handler no longer needs a validator at all:

```cs
app.MapPost("/orders", async (
    SubmitOrderRequest request,
    IOrderService orderService) =>
{
    var order = request.ToOrder();

    await orderService.SubmitOrder(order);

    return Results.Accepted();
});
```

`ToOrder()` converts the raw request into our domain types. Constructing them is what triggers the rules:

```cs
public static class SubmitOrderRequestExtensions
{
	public static Order ToOrder(this SubmitOrderRequest request)
	{
		var address = new ShippingAddress(request.ShippingAddress);

		var lines = request.OrderLines
			.Select(l => new OrderLine(l.ProductId, l.Quantity));

		return new Order(address, lines);
	}
}
```

We have _made illegal states unrepresentable_. You can't make a shipping address longer than 200 characters and you can't create an order with over 100 items. Nonody can forget to apply these rules.

## Input validation becomes a UX tool

There are still reasons to use an input validator like in our initial endpoint. They fail fast, they don't trigger any side effects and they bundle validation messages into a single error response instead of throwing on the first problem and returning only that. Just make sure you treat them in as API-level tools. don't give them the responsibility of protecting the integrity of your data and don't let them know too much details of your domain model.

You could reference your domain from the validator or leave out validation that is getting too complex:

```cs
RuleFor(x => x.ShippingAddress)
	.NotEmpty()
	.MaximumLength(ShippingAddress.MaxLength);
```

Tailor your validators to help users avoid common mistakes and leave the rest to the domain model.