---
slug: '/my-first-blog-post'
date: '2022-11-24'
title: 'My first blog post'
---

# Hi mom!

```cs
using System;

// Comment
[Serializable]
public class Example<T>
{
    private const int Number = 42;
    private bool enabled = true;
    private string name = "Hello";
    private char letter = 'A';

    public T Value { get; set; }

    public bool IsValid => Value != null;

    public void Run()
    {
        if (enabled && Number > 0)
        {
            var result = Calculate(Number);

            Console.WriteLine($"{name}: {result}");
        }
    }

    private static int Calculate(int value)
    {
        // Operators, keywords, numbers, strings, functions
        return value * 2 + 10;
    }

    private string Match(object value) => value switch
    {
        int n when n > 10 => "large",
        string s => s,
        null => "nothing",
        _ => "unknown"
    };
}
```
