---
slug: '/validation'
date: '2026-10-12'
title: 'Validation Belongs in the Type'
---

Here's an endpoint for placing orders in a webshop:

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

Validate the body, then hand it to the order service. It looks airtight: the only way to place an order is through this `POST /orders` handler so every request has to get past the validator first.

But it's only airtight _today_. What happens when someone:

- Adds a `POST /admin/orders` endpoint so admins can order on behalf of customers?
- Builds a subscription feature that creates orders on a schedule?
- Bolts a GraphQL API onto the backend?

Each of these creates a `SubmitOrderRequest`, and nothing forces them to validate it. The data lives in the request, but the rules live in a separate class, and the compiler doesn't care whether the two ever meet.

## Data and rules belong together

This is called **encapsulation**:

> Bundle data with its rules, so the data can only be used in ways that satisfy them.

`DateTimeOffset` is a good example. You can't create one with invalid data:

```cs
DateTimeOffset.Parse("next week");
// Throws FormatException

new DateTimeOffset(2026, 2, 30, 0, 0, 0, TimeSpan.Zero);
// Throws ArgumentOutOfRangeException: February 30th doesn't exist
```

So any method that accepts a `DateTimeOffset` can trust it:

```cs
void LogEvent(DateTimeOffset timestamp, string summary);
```

No need to write `if (timestamp.Month == 2 && timestamp.Day == 30)` at the top of every method that takes a date. The type already took care of it. Our `SubmitOrderRequest` offers no such guarantee, so everything that touches it has to wonder.

## Two rules, two homes

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

These two rules are different in kind. The first applies to a single value. The second applies to a collection of values, and that matters for where it should live.

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

There's now no way to hold a `ShippingAddress` that breaks the rule. It's reusable anywhere in the app, and if someone asks what the rules for an address are, there's exactly one file to open.

### The order lines

The quantity rule is trickier. No single `OrderLine` knows the total across all lines, so the rule has to live one level up, in whatever owns the lines. That's the order.

`SubmitOrderRequest` is just the shape of incoming JSON. The thing the business actually cares about is an `Order`, and it should be impossible to construct a broken one:

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

Notice what `Order` _doesn't_ do: it never checks the address length. That's `ShippingAddress`'s job. If the address limit changes, `Order` doesn't change. Each type guards its own piece of the truth.

## The simpler endpoint

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

## But what does the client see?

We traded something away. The old endpoint returned a friendly `ValidationProblem`. Now bad input throws, and an unhandled exception becomes a 500.

Since every rule throws `DomainException`, we can translate it to a 400 in one place:

```cs
public class DomainException(string message) : Exception(message);

public class DomainExceptionHandler : IExceptionHandler
{
	public async ValueTask<bool> TryHandleAsync(
		HttpContext context,
		Exception exception,
		CancellationToken cancellationToken)
	{
		if (exception is not DomainException)
		{
			return false;
		}

		context.Response.StatusCode = StatusCodes.Status400BadRequest;

		await context.Response.WriteAsJsonAsync(new ProblemDetails
		{
			Status = StatusCodes.Status400BadRequest,
			Title = "The request is invalid.",
			Detail = exception.Message
		}, cancellationToken);

		return true;
	}
}
```

```cs
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<DomainExceptionHandler>();

// ...

app.UseExceptionHandler();
```

One caveat: a constructor stops at the first broken rule, so clients see one error at a time. If you need to report every problem at once, such as on a big form, you can still run a validator at the API boundary. Just make sure you don't rely on it to keep your data safe, and you don't let it know too much about the internals of your system.

You can reference your domain from the validator or leave out validation that is getting too complex:

```cs
RuleFor(x => x.ShippingAddress)
	.NotEmpty()
	.MaximumLength(ShippingAddress.MaxLength);
```

## Back to our three scenarios

The admin endpoint, the subscription job and the GraphQL API all have to produce an `Order`, and the only way to do that is `new Order(...)`. None of them can forget to validate, because validation isn't a step anymore. It's part of what an `Order` is.
