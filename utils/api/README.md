# `ts-rest` README

After https://github.com/pubpub/pubpub/pull/2796 is merged, we can start using `ts-rest` to define our API routes.

This readme takes you through how and why.

## 🤔 Why?

The main motivation for this change are to improve `pubpub-client`.

1. We want to make the api routes more secure as we make them more easily accessible by third-party developers using the `pubpub-client` package, and
2. We want `pubpub-client` to remain in sync with the API routes.

This PR accomplishes 1 by adding `zod` validation, and 2 by either generating parts of `pubpub-client` from the generated OpenAPI spec, or by directly using the contract defined by `ts-rest` to generate (parts of) `pubpub-client`.

## 🔧 How does it do

Most of this is basic `ts-rest` stuff, for which I would recommend their documentation at https://ts-rest.com/docs.
We are using `@ts-rest/express` core to define the API contract, `@ts-rest/express` to define and generate the route handlers, and `@ts-rest/openapi` to generate the OpenAPI spec.

A short breakdown.

### 📈 Base contract

First we define a global contract for the API routes at `utils/api/contract.ts`, which you do somehting like

```ts
import { initContract } from '@ts-rest/core';

const c = initContract();

export const contract = c.router(
	{
		// sub routers/routes
	},
	{
		strictStatusCodes: true,
	},
);
```

The option `strictStatusCodes` will make sure that the status codes returned by the route handlers match the status codes defined in the contract. If this is `false` (the default) you can return any status code you want.
We mostly turn this on because it improves typechecking.

### 🚏 Sub routers

We then define sub routers for each of the routes we want to define in a separate file, e.g. `utils/api/contracts/collections.ts`:

```ts
const c = initContract();

export const collectionContract = c.router({
	create: {
		path: '/api/collections',
		method: 'POST',
		summary: 'Create a collection',
		description: 'Create a collection',
		body: collectionCreationSchema,
		responses: {
			201: collectionSchema,
		},
	},
});
```

We then import this into the main router and use it like this:

```ts
import { collectionContract } from './contracts/collections';

// ...

export const contract = c.router(
	{
		collections: collectionContract,
		// other sub routers
	},
	{
		strictStatusCodes: true,
	},
);
```

### 📏 Convention

I've chosen to go with the following convention, following that most routes are simple crud routes on `sequelize` models:

-   If a route has multiple methods, e.g. `GET` and `POST`, then the route is defined as a sub router, e.g. `collectionContract` above. The name of this router will be the name of the model that is the subject of the route, e.g. `collection`.
    -   Define the methods on that router, e.g. `create`, `update`, `remove`. Maybe this should follow the `CRUD` terminology more, for now I made it match the `pubpub-client` terminology.
        -   `GET` => `get` (maybe `read` is better, although sounds bad)
        -   `POST` => `create`
        -   `PUT` => `update`
        -   `DELETE` => `remove` (maybe `delete` is better)
    -   All other methods are defined as custom methods, e.g. `publish` or `unpublish` or `getMany`.
-   If the route in `/server/<model>/api.ts` only defines a single method that isn't very `CRUD`dy, create it as a route instead of a router
    -   You can do this by either defining the route directly in the main router, or by exporting something that satisfies `AppRoute`, imported from `@ts-rest/core`, liek this:

```ts
// /utils/api/contracts/login.ts
export const loginRoute = {
	path: '/api/login',
	method: 'POST',
	summary: 'Login',
	description: 'Login and returns authentication cookie',
	// ...
} satisfies AppRoute;
```

### ☑️ Validation

Validation is done with `zod` and is defined on the contract.

Just to keep things somewhat organized I put most of the validaiton schemas in `utils/api/schemas/`, and import them into the contracts.

#### ✍️ Defining schemas

Since we already have model types, and it would be nice to make sure that the validation schemas match the model types, you can do the following to make sure they are in sync.

```ts
import { z } from 'zod';
import { Collection } from 'server/models';

export const collectionSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	// ...
}) satisfies z.ZodType<Collection>;
```

You can also do this for creation using `sequelize`s built in `CreationAttributes`, e.g.:

```ts
import { CreationAttributes } from 'sequelize';

export const collectionCreateSchema = collectionSchema
	.omit({
		id: true,
		createdAt: true,
		updatedAt: true,
		deletedAt: true,
	})
	.partial() satisfies z.ZodType<CreationAttributs<Collection>>;
```

or with this helper I defined for updates

```ts
import { UpdateParams } from 'types';

export const collectionUpdateSchema = collectionSchema.pick({
	title: true,
	slug: true,
}) satisfies z.ZodType<UpdateParams<Collection>>;
```

This way Typescript will yell at you until they are in sync.

#### ✅ Using schemas

You can then use the schemas in the contract like this:

```ts
import { collectionSchema } from '../schemas/collection';

export const collectionContract = c.router({
	create: {
		path: '/api/collections',
		method: 'POST',
		summary: 'Create a collection',
		description: 'Create a collection',
		body: collectionSchema,
		responses: {
			201: collectionSchema,
		},
	},
});
```

This way, when we implement this route (or generate a client), we can be sure that the request body and response body match the schema.

> [!NOTE]  
> The response body does not get validated by default when implementing the express routes. You can turn this on, but I wouldnt recommend it.
> The response is here just for typechecking, and to generate the OpenAPI spec.

#### 💁 Tips for creating schemas

##### 🤖 Use AI to get started

Manualy typing out a schema is so boring! Just throw the `sequelize-typescript` model from `server/models` into ChatGPT and ask it to make a zod schema for you. It will do a pretty decent job.

##### ♻️ Reuse schemas

Instead of redefining the same schema over and over again, you can use/extend/combine schemas to make your life easier, and, more importantly, to make sure you only have to define complex fiels once.

```ts
export const collectionSchema = z.object({
	// big thing, don't want to update that in multiple places!
	slug: z
		.string()
		.regex(/^[a-zA-Z0-9-]+$/)
		.min(1)
		.max(280),
});

// partial makes things optional, like `Partial` in typescript
export const collectionUpdateSchema = collectionSchema.partial() satisfies z.ZodType<
	UpdateParams<Collection>
>;
```

This will also help with documentation, as we see below.

Have a look at the `zod` docs at https://zod.dev for all the things you can do.

Most useful

-   `.extend`
-   `.pick`
-   `.omit`
-   `.partial`
-   `.merge`

### Generating the OpenAPI spec

The OpenAPI spec is generated using `@ts-rest/openapi` and is available at `/spec.json`.

The generation happens in `utils/api/openapi-router.ts`, and is implemented at `server/apidocs/api.ts`

#### 📖 Documentation

Most documentation is generated from the fields you define in the contract, e.g. `summary` and `description` in the example above.

You can add extra documentation to the parts generated from the schema like this

```ts
import { z } from 'zod';
import { extendZodWithOpenApi } from '@anatine/zod-openapi';

extendZodWithOpenApi(z);

export const collectionSchema = z.object({
	title: z.string().openapi({
		description: 'The title of the collection',
		example: 'A wonderful title',
	}),
});
```

which will then show up like this

![image](https://github.com/pubpub/pubpub/assets/21983833/08a486a0-54fa-456f-849a-f59c4ad3535f)

Neat! Can be useful to add examples, or to add extra documentation for fields that are not obvious.

#### Structuring the documentation

The way we have declared the contract now creates a structue of the documentation that looks like this:
![image](https://github.com/pubpub/pubpub/assets/21983833/eec7bb05-8434-4c45-8866-039d0834e54d)

With the subrouters becoming folders, the `summary` fields of the contract acting like titles.

### 🚏 Implementing the routes

Nice contract, but how do we make it do something?

As follows:

1. We implement the routes in the corresponding files, e.g. `server/collection/api.ts`:

```ts
import { contract } from 'utils/api/contract'; // make sure to import the main contract, not the `collectionContract`

const s = initServer();

export const collectionServer = s.router(contract.collection, {
    create: async ({ req, body, params }) => {
        const { title, slug } = body;
        const collection = await Collection.create({ title, slug });
        return {
            status: 201,
            body: collection,
        };
       }
    },
    // ...
})
```

2. We then have a main server-router in `/utils/api/server.ts`, which imports all the subservers and combines them into a single router:

```ts
import { initServer } from '@ts-rest/express';

const s = initServer();

export const server = s.router(contract, {
	collection: collectionServer,
	// ...
});
```

3. We initialize the routes `/server/server.ts`

```ts
import { server } from 'utils/api/server';
import { contract } from 'utils/api/contract';
import { createExpressEndpoints } from '@ts-rest/express';

const app = express();
// ...

// this creates all the routes
createExpressEndpoints(contract, server, app);
```

#### ⛰ Why not put the routes nearer to the contract?

We implement the routes in `/server/api` instead of in like `/utils/api/servers/collection.ts` because otherwise it becomes too easy to circularly import things, especially to accidentally import some server code into the contract, which would be bad as that is potentially client code. If we would import server logic there, the client would need to import `sequelize` and all the models, which is not great as it creates a ton of circular dependencies and inflates the client bundle size.

This is not ideal, if you have a better idea for folder structure im happy to hear it

#### 🥌 Different handlers

The handlers we define with `ts-rest` look slightly different than the default Express ones.
Most important are

1. The parameters are different. Instead of `req, res, next`, it's `{ req, res, body, params, request }`.
2. `req` and `res` are not typed strongly. For `req` this will change as soon as [my PR that fixes this is released](https://github.com/ts-rest/ts-rest/pull/372#issuecomment-1699161432), but `res` will probably stay untyped, which brings me to the last one
3. Instead of returning `res.status(200).json({...})`, you return `{ status: 200, body: {...} }`. This is a limitation of `ts-rest`, and is not one that is easily solved because something something contravariance. You'll need to rewrite the routes slightly, but it's finee. (Note: `res.status...` will still work, but TypeScript will complain about the return type not matching the contract)

### 📦 Generating the client

The client is generated using `@ts-rest/client` and is available at `utils/api/client.ts`.

It's extremely easy, like

```ts
import { contract } from 'utils/api/contract';
import { initClient } from '@ts-rest/core';

export const client = initClient(contract, {
	baseUrl: '',
	baseHeaders: {},
	credentials: 'include',
});
```

Now you can do things like

```ts
import { client } from 'utils/api/client';

const collection = await client.collection.create({
	body: {
		title: 'A wonderful title',
	},
});
```

#### 👛 Difference with `apiFetch`

The main difference with `apiFetch` is that the client is typed, and that it will throw an error if the response status code is not in the contract. This is a good thing, as it will make sure that the client is always in sync with the API.

The API is also slightly different, instead of

```ts
apiFetch.post('/api/collections', {
	title: 'A wonderful title',
});
```

you do

```ts
client.collection.create({
	body: {
		title: 'A wonderful title',
	},
});
```

The returntype is also different.

Instead of

```ts
const collection = await apiFetch.post('/api/collections', {
	title: 'A wonderful title',
});

collection.title; // any, but it's there
```

You get a `{status: number, body: T}`

```ts
const collection = await client.collection.create({
	body: {
		title: 'A wonderful title',
	},
});

collection.body.title; // string
```

This is slightly more annoying, but it allows you to do things like

```ts
const collection = await client.collection.create({
	body: {
		title: 'A wonderful title',
	},
});

if (collection.status === 201) {
	collection.body.title; // string
} else {
	console.log(collection.status); // 400, 500, etc
}
```

This might not be worth it though, and I could change this if we don't like it.

### That's it!

You now have a fully typed API client, and a nice OpenAPI spec, woo.
