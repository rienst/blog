---
slug: '/validation'
date: '2026-10-12'
title: 'Turn validators into a domain model'
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

It validates the body, then sends it off to the order service. It does the job: the only way to place an order is through this `POST /orders` handler which means every request has to get past the validator first.

But what happens when someone:

- Adds a `POST /admin/orders` endpoint so admins can add orders on behalf of customers?
- Builds a subscription feature that creates orders on a schedule?
- Creates a GraphQL API which allows order placing too?

Each of these additions to the codebase probably calls `new SubmitOrderRequest(...)` somewhere along the way, and nothing forces the developer to validate it before sending it to the order service. The data lives in the request, but the rules live in a separate class, and the compiler doesn't care whether the two ever meet.

## Logic should be close to the data it acts upon

The validator class basically violates the principle of **encapsulation**:

> Bundle data with the rules that belong to it, so the data can only be used in ways that satisfy those rules.

This same idea is also refered to as:

> Make illegal states unrepresentable

If you don't want to allow something to be in a certain state then you should make it impossible for that thing to be placed in that state. An example of a class that implements this idea is the `DateTimeOffset` class. You can't create an instance of it that's in an invalid state:

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

## Going back to the endpoint

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

## Validation errors

Up to now, we have ignored a significant feature of the initial endpoint. It returned a nice 400 response with the validation errors described in the response body. With our new approach, bad input throws an exception somewhere and the client gets a 500 back.

To fix this we just need to handle those exceptions better. This is why we set up every rule to throw `DomainException`s so we can translate them into 400 responses from an `IExceptionHandler`:

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
