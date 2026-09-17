---
slug: '/result-objects'
date: '2026-09-17'
title: 'Result objects and their place in your toolkit'
---

A method has a certain responsiblity which should match its signature. Lets look at this application service:

```cs
public interface IOrderService
{
    async Task ProcessOrder(Order order);
}
```

This signature reveals the responsibility of the `ProcessOrder` method: take an `Order` object and process it. Given that it is an application service, we also give it the responsiblity of enforcing domain rules. In this case, we don't want to place orders for users that are not able to place them.

```cs
public async Task ProcessOrder(Order order)
{
    var user = await _userRepository.GetUser(order.UserId);

    if (!user.CanPlaceOrders)
    {
        throw new UserCannotPlaceOrdersException(user.Id);
    }

    ...
}
```
