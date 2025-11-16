Title: One-Line Magic: Writing Elegant Python with List Comprehensions
Data: September 25, 2025
Tags: python, list comprehension, best practice, pythonic, tutorial
Categories: Python, For Beginners, Tutorial

Let's admit it: we've all written this kind of code. You need to create a new list based on an existing one, and you instinctively type:

```python
numbers = [1, 2, 3, 4, 5, 6]
squared_numbers = []
for num in numbers:
    squared_numbers.append(num * num)
print(squared_numbers)
    
# squared_numbers is now -> [1, 4, 9, 16, 25, 36]
```

This code works. It's clear. But it's not... elegant. It takes up 3 lines for a fairly simple operation. In Python, there is a better, more expressive, and often faster way. It's called a **List Comprehension**.

![Comparison of a for-loop and a List Comprehension](src/images/blog/list-comprehension.png)

### What is a List Comprehension?

It's syntactic sugar that allows you to create lists from other iterables (like lists, tuples, strings, etc.) in a single, concise line.

Let's rewrite our number-squaring example:

```python
numbers = [1, 2, 3, 4, 5, 6]
squared_numbers = [num * num for num in numbers]
print(squared_numbers)

# The result is the same: [1, 4, 9, 16, 25, 36]
```
Cleaner, right? Let's break down its structure:
`[expression for item in iterable]`

-   **`expression`**: What we want to do with each item (`num * num`).
-   **`for item in iterable`**: The standard loop that iterates through the items.

### Adding Conditions

So where's the magic, you ask? It's in the ability to add conditions right into the same line! Let's say we want to get the squares of only the even numbers.

**The classic approach:**
```python
numbers = [1, 2, 3, 4, 5, 6]
squared_even_numbers = []
for num in numbers:
    if num % 2 == 0:
        squared_even_numbers.append(num * num)
print(squared_even_numbers)

# result -> [4, 16, 36]
```

**With a List Comprehension:**
```python
numbers = [1, 2, 3, 4, 5, 6]
squared_even_numbers = [num * num for num in numbers if num % 2 == 0]
print(squared_even_numbers)

# result -> [4, 16, 36]
```
The `if` condition is simply added to the end. It's incredibly readable: "get the square of the number for each number in the list, *if* the number is even."

### What about `if-else`?

Sometimes we need to apply different logic based on a condition. For example, labeling numbers as "even" or "odd". Here, the syntax changes slightly: the ternary `if-else` operator is placed **before** the loop.

```python
numbers = [1, 2, 3, 4, 5, 6]
labels = ["even" if num % 2 == 0 else "odd" for num in numbers]
print(labels)

# result -> ['odd', 'even', 'odd', 'even', 'odd', 'even']
```

### Why should you use them?

1.  **Conciseness and Readability:** The code becomes more compact, and its intent becomes clearer (once you get used to the syntax).
2.  **Performance:** In many cases, List Comprehensions are faster than regular `for` loops with `.append()`, as they are implemented at a lower level in C and are highly optimized.
3.  **Expressiveness:** This is "idiomatic" Python. Using constructs like this shows that you understand the philosophy of the language.

So, the next time you start to type `new_list = []`, pause for a second and ask yourself: can this be done with some one-line magic?
