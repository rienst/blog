---
title: 'Using a monorepo to manage dependencies'
postedOn: '2025-03-11'
---

Using [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces), you can create multiple npm packages inside a root package. You can then add them as dependencies to each other, just like any external dependency your project might have.

To configure npm workspaces, you just have to add the following to your root `package.json` file:

```json@package.json
{
  "name": "my-monorepo",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
}
```

This tells npm that this package is actually a workspace package and that it has to look for sub packages inside the `apps` and `packages` directories. Each nested package is a directory with its own `package.json` file. It can have its own dependencies. For example:

```json@packages/logging/package.json
{
  "name": "@my-monorepo/logging",
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

> All dependencies of all packages inside the workspace will be installed in the top-level `node_modules` directory.

## Multiple apps

We have now created a monorepo, which is useful if we have multiple applications and we want to share some common logic. We can create packages for the specific applications we are building, as well as for the logic we wish to use in both those apps:

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

Inside the `admin-website` project we can, for instance, add the `@my-monorepo/logging` package:

```json@apps/admin-website/package.json
{
  "name": "@my-monorepo/admin-website",
  "dependencies": {
    "@my-monorepo/logging": "*"
  }
}
```

We can now use our own logging package inside the admin website:

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

> To learn more about npm workspaces, visit the [official docs](https://docs.npmjs.com/cli/using-npm/workspaces).

## But I'm just building a single app

Okay, monorepos are useful when building multiple applications, but they are also very useful when you are building just a single application. This is because when you split your code up into multiple packages, you create concrete boundaries between them.

To illustrate the problem, lets say you have this function:

```ts@my-app/users.ts
import { userDb } from '@/db/user-db.ts'

export async function createUser(user: User) {
  if (user.name.length < 3) {
    throw new Error('Cannot create a user with a name shorter than 3 characters')
  }

  return userDb.createUser(user)
}
```

This logic is being applied every time somebody calls `createUser`. But what keeps a junior engineer from just using the `userDb` directly?

```ts@my-app/some-other-file.ts
import { userDb } from '@/db/user-db.ts'

export async function createUserFormHandler(formData: FormData) {
  try {
    const name = formData.get('name')

    const user: User = {
      name: typeof name === 'string' ? name : ''
    }

[!]    await userDb.createUser(user)

    return {
      success: true,
      message: `Successfully created user with id ${user.id}!`
    }
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong'
    }
  }
}
```

How do you manage which files can access which? That is what a monorepo can help you with. In this example, you might want to create a structure like this:

```json@package.json
{
  "name": "my-app",
  "workspaces": [
    "app", // Your main app
    "packages/*"
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
│   ├── users
│       └── package.json
└── package.json
```

- `db` contains the files that instantiate the `userDb` variable. It also exposes that variable to other packages that have specified the `db` package as a dependency.
- `users` contains our initial `createUser` function which checks the length of the users name and then calls `userDb.createUser`.
- `app` is our main product. It could be a Next.js app, a Lambda function handler or something along those lines. It calls the `createUser` function when a user should be created.

This means that `app` depends on `users` and `users` depends on `db`. **But `app` does not depend directly on `db`**, meaning its `package.json` will look something like this:

```json@app/package.json
{
  "name": "@my-app/app",
  "dependencies": {
    "@my-app/users": "*"
  }
}
```

And indeed, this would be the `package.json` for `users`, specifying a dependency to `@my-app/db`:

```json@packages/users/package.json
{
  "name": "@my-app/users",
  "dependencies": {
    "@my-app/db": "*"
  }
}
```

Because we've now managed our dependency structure using multiple packages, making sure that the main app does not directly depend on `@my-app/db`, the junior developer can no longer make the mistake of using the `userDb` directly:

```ts@my-app/some-other-file.ts
import { userDb } from '@my-app/db'
```

[error]
Cannot find module '@my-app/db' or its corresponding type declarations.
[/error]

This helps you bring structure to your codebase, even when you are just writing a single application.
