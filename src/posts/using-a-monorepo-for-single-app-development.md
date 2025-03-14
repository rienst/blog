---
title: 'Using a monorepo for single app development'
postedOn: '2025-03-11'
---

A monorepo is a single repository containing multiple projects. This can be very useful when you are building multiple applications that share common logic, but I would like to make a case for utilizing a monorepo setup even when you are developing a single application.

First, I will discuss monorepos and npm workspaces but feel free to jump to [using a monorepo for a single app](#but-i-m-just-building-a-single-app) if you're just interested in that part.

## Monorepos with npm workspaces

With [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) you can create multiple npm packages inside a root package. You can then add them as dependencies to each other, just like any external dependency your project might have.

To configure npm workspaces, you just have to add the following to your root `package.json` file:

```json@my-monorepo/package.json
{
  "name": "my-monorepo",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
}
```

This tells npm that this package is actually a workspace root package and that sub-packages are located inside the `apps` and `packages` directories. Each sub-package is a directory with its own `package.json` file. It can have its own dependencies. For example:

```json@my-monorepo/packages/logging/package.json
{
  "name": "@my-monorepo/logging",
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

> I like to use the `@root-package/` prefix in the package name to make it clear that this package is part of our monorepo.

We have now created a monorepo, which is useful if we have multiple applications and we want to share some common logic between them. We can create packages for the specific applications we are building, as well as for the logic we wish to share between them.

Let's say we're building two apps:

- A public website for our company
- A web app for employees to manage the content on the public website

And let's say we find three things inside those applications that are quite similar:

- We're logging to an external system in both apps
- We're using similar basic UI components
- Both apps handle form submissions and require similar form validation utilities

We could set up our monorepo like this:

```
my-monorepo
├── apps
│   ├── admin-website
│   │   └── package.json
│   └── public-website
│       └── package.json
├── packages
│   ├── logging
│   │   └── package.json
│   ├── ui
│   │   └── package.json
│   └── validation
│       └── package.json
└── package.json
```

The `package.json` of the `admin-website` package would look like this:

```json@apps/admin-website/package.json
{
  "name": "@my-monorepo/admin-website",
  "dependencies": {
    "@my-monorepo/logging": "*",
    "@my-monorepo/ui": "*",
    "@my-monorepo/validation": "*"
  }
}
```

Now we can use the logic exported from our three packages inside the admin website code, just like how we would use any other external package:

```ts@my-monorepo/apps/admin-portal/save-user.ts
import { logError } from '@my-monorepo/logging'

async function saveUser(user: User) {
  try {
    await db.saveUser(user)
    return 'Success!'
  } catch (error) {
    logError(error)
    return 'Oops!'
  }
}
```

Nice! No more similar code in both apps. And if we ever want to switch external logging solutions, we only have to make changes in `@my-monorepo/logging` and not across both of our apps.

> To learn more about npm workspaces, visit the [official docs](https://docs.npmjs.com/cli/using-npm/workspaces).

## But I'm just building a single app

Okay, so monorepos are useful when building multiple applications. In that scenario, it is quite an obvious design choice to make. But as I've been working inside a monorepo, I've found another—maybe even greater—benefit to splitting code into multiple packages: It gives you the tools to specify concrete boundaries within your project.

To illustrate the problem this is solving, imagine you've been working on this function:

```ts
async function createUser(user: User) {
  if (user.name.length < 3) {
    throw new Error(
      'Cannot create a user with a name shorter than 3 characters'
    )
  }

  return userDb.createUser(user)
}
```

It performs some validation check on the users name, and if it passes, it hands down the `User` instance to the `userDb` which will store it somewhere. This validation check is obviously being applied every time somebody calls `createUser`. But what keeps a junior engineer—or you after six months of not working on this codebase—from just using the `userDb` directly?

```ts
import { userDb } from '@/db/user-db.ts'

export async function createUserFormHandler(formData: FormData) {
  try {
    const name = formData.get('name')

    const user: User = {
      name: typeof name === 'string' ? name : '',
    }

    await userDb.createUser(user)

    return {
      success: true,
      message: `Successfully created user with id ${user.id}!`,
    }
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong',
    }
  }
}
```

Oops, this form handler calls `userDb.createUser` without first validating the users name. The underlying problem here is that we have no way of managing which files can access which. We can just import anything we need, wherever we need it. This dramatically increases the the chances for the project to become a 'big ball of mud'.

What we need are tools to specify which files can import which other files, and prevent us from accidentally importing them from somewhere else. I think this is a very suitable use case for a monorepo architecture. Let's set up our root package like this:

```json@my-app/package.json
{
  "name": "my-app",
  "workspaces": [
    "app", // The main app we're building
    "packages/*" // Any supporting packages
  ],
}
```

The file tree would look something like this:

```
my-app
├── app
│   └── package.json
├── packages
│   ├── db
│   │   └── package.json
│   └── users
│       └── package.json
└── package.json
```

- `db` contains the files that instantiate the `userDb` variable.
- `users` contains our initial `createUser` function which checks the length of the users name and then calls `userDb.createUser`.
- `app` is our main product. It needs to call the `createUser` function when somebody submits the 'create user' form.

Let's look at the dependency structure, which is the most important part of this story: **`app` depends on `users` and `users` depends on `db`, but `app` does not depend directly on `db`**. This means the `package.json` of `app` should only reference `@my-app/users`:

```json@my-app/app/package.json
{
  "name": "@my-app/app",
  "dependencies": {
    "@my-app/users": "*"
  }
}
```

> Again: The `@my-app/` prefix is used to make it clear that this package is part of our monorepo.

And indeed, this would be the `package.json` for `users`, specifying a dependency only on `@my-app/db`:

```json@my-app/packages/users/package.json
{
  "name": "@my-app/users",
  "dependencies": {
    "@my-app/db": "*"
  }
}
```

Not only have we specified the dependency structure we wish to have, we've also put guardrails in place so we don't accidentally violate this structure. In concrete terms, we cannot import the `userDb` directly from our `app` package anymore. If we try, we get an actual error:

[error]
Cannot find module '@my-app/db' or its corresponding type declarations.
[/error]

## Conclusion

A monorepo helps you share logic when you're building multiple apps, but it can also be a useful tool for managing dependencies within a single application. Splitting logic into separate packages helps you see the different parts that make up your app and protects the boundaries between.
