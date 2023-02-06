# The Book of Facets

A **facet** is a kind of structured data that attaches to any kind of **scope**: a Community, Collection, or Pub. We have facets because we often want to unify a certain behavior across all scope kinds — for instance, to let any scope kind accept a certain metadata value. We also sometimes want to decouple where a property is _stored_ from where it is _used_ — for instance, we want to let users configure default values for Pub settings at the Community level.

# Quick start: Working with facets

_I want to add a new facet:_

1. First, read [Are facets the right choice for my new feature?](#are-facets-the-right-choice-for-my-new-feature) It's possible that you actually don't want a facet for your use case, or you may have to plan some work on the Facets system itself into your project. That could be fun!

2. Then, read [Anatomy of a facet definition](#anatomy-of-a-facet-definition). Armed with this, and cribbing from the existing facets, add a new definition to `facets/definitions`. Make sure to export the facet by name in `index.ts`, and also add it to `ALL_FACET_DEFINITIONS`.

3. The next time you start your server, PubPub will automatically create a table for your new facet. That's all you need to start storing data in it!

4. If you want users to edit your facet using `<FacetEditor>`, first read [Adding an editor for a new facet](#adding-an-editor-for-a-new-facet). Add your new editor definition to `client/components/FacetEditor/definitions`. Don't forget to export it from `index.ts` and register it in `FacetEditor.tsx` under `editorsForFacets`.

5. Depending on what your facet does, you may consider adding it to `PubSettings.tsx` or `CommunityOrCollectionLevelPubSettings.tsx`. You may also want to use a `<PopoverButton>` to launch the `<FacetEditor>` from another UI element as described [here](#usage-with-popoverbutton).

_I want to work with an existing facet:_

5. If you want to query the value of a facet from somewhere on the client, read up on [`useFacetsQuery()`](#usefacetsquery). If you want to _update_ the facet from something other than the `<FacetEditor>`, read up on [`useFacetsState()`](#usefacetsstate).

6. If you want to query or update a facet from somewhere in non-client code (an unusual server method, a worker task, a tool, or something else), read up on [fetching](#fetching-specific-facets-or-facets-for-many-scopes) and [updating](#updating-facets-for-a-single-scope) facet values.

7. If you want to update the structure of a facet, you'll need to do so more or less manually, using a Sequelize migration. [This section](#migrations-for-facet-definitions) goes into a bit more detail.

# Introduction

At the highest level, facets are:

-   Made of _props_ — they're just objects with properties, one layer deep
-   Defined in a backend-agnostic way in the `facets/definitions` directory
-   Stored in regular Postgres tables managed by Sequelize
-   ✨ _Cascading_ ✨ — values from parent scopes are used as defaults by their descendants
-   Useful for storing serializable data — less so anything that requires associations or foreign keys
-   Readable to the world. Writable by any `Member` of a scope with `manage`-level permissions or higher.

If you haven't already, you should start by visiting `facets/definitions` to get a feel for how we define facets in practice.

## Motivation and history

Consider two throughlines of PubPub's evolution over the years:

-   Users like that PubPub's unopinionated scope names — Community, Collection and Pub — can flex to cover periodicals, books, conferences, and works less easily categorized. But while the names are unopinionated, the implementations aren't. There is often a single "PubPub way" to do something that falls out of emergent behavior, but it isn't always discovered through experimentation or self-expression. For some users, our nouns feel like just another box.

-   Users have always wanted "cascading Pub settings" to keep the look and feel of their Community consistent — if they prefer a certain Pub header style, and a certain citation format, they shouldn't have to configure those for each new Pub. Instead they can set the style once on the Community, and let it "cascade" down into the Pubs.

Facets were born from the implementation of "cascading Pub settings" in the second point, but they are also a big step towards addressing the first. With facets, we aim to grow the set of capabilities shared by all scopes, giving users more ways to structure their Communities. In time, the practical differences between our scope types may become a blurry formality. We might even choose to migrate them to a generic `Scope` that has no properties until facets are applied to it.

In that vein, we think about Facets as the seed of a "structurally-typed CMS": a publishing platform with a single generic content type, whose instances are distinguished _structurally_, by the properties they happen to have, rather than _nominally_, e.g. because they are intrinsically a Community, Collection, or Pub.

_You might like to skim [Everything is a Facet](https://notes.knowledgefutures.org/pub/tmn1hqhi/) and [Everything is a Scope](https://notes.knowledgefutures.org/pub/8fafd9il/) for some early thinking on this topic._

## A maxim

Here's a rule that, if you let it percolate while you sleep, explains a lot about how facets work:

> Every scope has exactly one value for each facet.

Don't try to parse this out right now — but try to hold it in your head as you read.

## Some terminology

Here are three different things that you might informally refer to as a "facet":

-   A **facet definition** (`FacetDefinition`) is a JavaScript object that describes the properties that a kind of facet has. We derive a TypeScript type and a Sequelize-backed database table from this.

-   A **facet instance** (`FacetInstance<Definition>`) is a JavaScript object that satisfies a facet definition. These are attached to a scope and stored in entries of the Postgres table for its `Definition`. We mostly manipulate these in server-side CRUD code.

-   A **facet value** (`FacetValue<Definition>`) is a **read-only value** computed on the fly by examining the facet instances of a scope and its ancestors, and "cascading" its values, generally so that lower scopes take precedence. This is what client-side code will see as the facet value for a scope. We don't persist these anywhere, but we could as a caching optimization.

These are listed in order of durability. **Facet definitions** are hard-coded in our source; **facet instances** live in our database; **facet values** are ephemeral and exist in memory and on the wire.

Let's reconsider our maxim using these new terms:

> Every scope has exactly one `FacetValue<Def>` for each `FacetDefinition`
>
> ... _(which is computed from the `FacetInstance<Def>` database entries for the scope and its parents)_.

# Are facets the right choice for my new feature?

Glad you asked! Here are some things to consider. You might find some dealbreakers in here, or some cool projects to vastly expand the utility of Facets — it's up to you whether you want to extend this system to meet more of PubPub's needs.

## Will my feature require me to bulk-load facets for many scopes?

The current Facets system is best understood as an implementation of "cascading Pub settings" for these Pub settings:

-   Header theme
-   Citation style
-   License
-   In-text node labels
-   Look and feel of Connections

All of these settings are _only_ relevant on the Pub routes under `/pub/<slug>`, and in the Dashboard for that Pub. They do _not_ appear, for instance, when this Pub is rendered as part of a long list of Pubs in a Collection layout.

Therefore, we haven't done any optimization of bulk-loading of facets for many Pubs at once. This may be too slow as-is. So if your facet will need to be loaded for hundreds of scopes at once, you might want to:

-   Not use a facet
-   Benchmark to be very sure it's okay to use facets in this case. You might need to load only a few scopes, or maybe you're building a worker task, where latency is less important.
-   Embark an an optimization project like the one sketched out in [Sketch: Improving bulk facet load performance with archetypes](#sketch-improving-bulk-facet-load-performance-with-archetypes).

## Do I want to write queries against the facet?

Ideally we'd have a `getScopesMatchingFacet()` that would give you all the scopes in a Community whose facets match a certain value. We don't have this function yet. It's a totally tractable problem, but since computing a facet value requires looking at all of a scope's parents, the queries required aren't readily expressed in a single SQL query or Sequelize call.

Building out the archetypes pattern mentioned above might make _this_ much easier to implement.

## Do I need foreign keys? Can I fit everything I need into a single table?

Facets don't hold foreign keys, so they can't reference other objects on PubPub in a way that the database knows about. There's nothing stopping you from adding a UUID to a facet prop, but your code will be responsible for interpreting it, and loading any associated models. As far as Facets knows, it's just a string.

Adding foreign key support to Facets would be a big project involving some Postgres acrobatics. A reasonable first step in this direction would be [a dataloader pattern like the one we use for `ActivityItems`](https://github.com/pubpub/pubpub/blob/master/server/activityItem/fetch.ts) that automatically fetches certain models when facets are loaded. This would let us e.g. store IDs for `User` models in an `Attributions` facet, and send the associated `Users` to the client to render their name and avatar.

## Do I really want cascading? Do I want to limit my facet to certain scope types?

There's currently no way to turn off cascading for a facet, or to only allow it to bind to certain scope types. But neither would be terribly hard to implement!

## Do I need a special permissions structure or read-only/derived values?

Facets are currently writable by all members of a scope with `manage` permission or higher. There's also no facility for creating read-only or derived facet props. Both of these things would be relatively simple to add, though.

# Anatomy of a facet definition

Here I'll omitting some TypeScript generics-plumbing for the sake of readability, and I'll speak somewhat loosely about types. TL;DR:

-   A `FacetDefinition` is made of a name, label, and some `FacetProps`.
-   A `FacetProp` is made of a name, label, a default value, and a `FacetPropType`.
-   A `FacetPropType` is a wrapper around a [`zod`](https://github.com/colinhacks/zod) type definition. We derive a TS and a Postgres type from it.

Feel free to allow along using the examples in `facets/definitions`.

## Defining a facet

The `facet()` function is used to create a facet definition:

```ts
facet({
    name: string,
    label?: string
    props: Record<string, FacetPropType>,
}): FacetDefinition
```

It takes as arguments:

-   A `name` for the facet. By convention, this is `PascalCased`.
-   An optional `label` for the facet — a very short description that may appear in the UI.
-   A `props` that describe its properties.

> ⚠️ By convention, a facet is exported from `facets/definitions/index.ts` using a symbol name that matches its `name` property. We must also add it to `ALL_FACET_DEFINITIONS` in that file. (This is important, and is something we could choose to enforce programmatically in the future.)

<details>
<summary>
<strong>Example: the <code>PubHeaderTheme</code> definition</strong>
</summary>

Here's a the actual definition of the `PubHeaderTheme` facet at the time of writing. We'll dive into parts of this throughout this section.

```ts
import { prop, facet, string, choice } from '../core';

const textStylePropType = choice(['dark', 'light', 'black-blocks', 'white-blocks']);

export const PubHeaderTheme = facet({
	name: 'PubHeaderTheme',
	label: 'Pub header theme',
	props: {
		backgroundImage: prop(string, { label: 'Background image', rootValue: null }),
		backgroundColor: prop(string, { label: 'Background color', rootValue: 'community' }),
		textStyle: prop(textStylePropType, { label: 'Text style', rootValue: 'light' }),
	},
});
```

</details>

## Defining facet props

The `prop()` function is used to define a facet prop:

```ts
prop(propType: FacetPropType, options: {
    label: string,
    rootValue: null | T,
    cascade?: CascadeStrategy,
}): FacetProp
```

The `propType` argument is (and must be) a JavaScript object, _not_ a TypeScript type. From it, we infer `T`, a TypeScript type corresponding to `propType` (more on the why and how of this soon). The rest of the prop definition is:

-   A `label` which is short, human-readable, and may appear in the UI.
-   A `rootValue` that can be used as the top of the cascade. This is a kind of default value — it's the value the prop takes on if it's not specified at any specific scope.
-   a `cascade` value that explains how the prop should cascade from scope to scope (see [Advanced: cascade strategies](#advanced-cascade-strategies)).

(To learn more about `rootValue` and `cascade`, see the section on Cascading, below.)

A `FacetProp` doesn't intrinsically have a name — this is provided by the keys of a `FacetDefinition`'s `props` object. So you _could_ reuse a single facet prop definition among multiple facet definitions, if it made sense to do so.

<details>
<summary>
<strong>Example: the <code>backgroundImage</code> prop</strong>
</summary>

Let's focus on the `textStyle` prop from `PubHeaderTheme`. Broken out, it's:

```ts
import { prop, facet, string, choice } from '../core';

const textStylePropType = choice(['dark', 'light', 'black-blocks', 'white-blocks']);
const textStyle = prop(textStyle, { label: 'Text style', rootValue: 'light' });
```

Consider the relationship between `textStylePropType` and `rootValue` here. The `choice()` function creates a `FacetPropType` that corresponds to the TypeScript type `'dark' | 'light' | 'black-blocks' | 'light-blocks'`. Our TypeScript plumbing then enforces that `rootValue` takes one of those values.

</details>

## Defining facet prop types

The `propType()` function defines a facet prop type:

```ts
propType({
    name: string,
    schema: zod.Schema,
    postgresType: string,
    extension?: Record<string, any>,
}): FacetPropType
```

Taking these values:

-   `name` is a string that exists for debugging purposes.
-   `schema` is a zod schema (e.g. `z.string()`) that defines this type.
-   `postgresType` is the Postgres datatype that we'll use to store values of this `propType` in the database. It must accept a JSON-serialized version of `schema` — so it will probably be `'jsonb'` unless it's a scalar type.
-   `extension` holds some context-specific extras that application code can use. This is usually duplicating some of the internals of `schema`, which is closed for inspection after it's created.

The `facets/core/primitives.ts` file holds prop types for your usual scalar types: strings, booleans, and numbers. You'll want to import and reuse those instead of re-rolling them. Thus, future uses of `propType()` should probably be for specific JSON object shapes — the `NodeLabels` facet has some good examples of non-scalar facet prop types.

<details>
<summary>
<strong>Example: the <code>integer</code> prop type</strong>
</summary>

Here's the interesting (if not particularly complicated) `FacetPropType` to represent integers.

```ts
export const integer = propType({
	name: 'integer',
	schema: z.number().int(),
	postgresType: 'integer',
});
```

</details>

## Wait, what is `zod` and why are we using it?

[`zod`](https://github.com/colinhacks/zod) lets us define TypeScript types (compile-time constructs which are erased at runtime) using JavaScript objects (which can be examined at runtime). It gives us runtime and compile-time versions of a type that are kept in lockstep. Here is a minimal Zod example:

```ts
import { z } from 'zod';

const User = z.object({ username: z.string() });
type User = z.infer<typeof User>; // { username: string }
```

This seems backwards at first; why define types with runtime objects? _Because you can't do it the other way around:_ there is a `typeof` operator in TS that lets you infer a type from a runtime object, but nothing that lets you do the opposite.

Zod is a well-tested, widely-used elaboration on this idea. It's _great_ for Facets because we want good TypeScript coverage, but we also want to construct database tables and parse objects against a schema at runtime.

# Some important types

There are a _lot_ of types are exported from the `facets` directory. Knowing what these ones mean will help you get a handle on the rest. Refer also to:

-   The [Some Terminology](#some-terminology) section for details on the difference between facet definitions, instances, and values
-   The [Cascading, nullability, and root values](#cascading-nullability-and-root-values) section (just below) for more details on the relationship between prop nullability and cascading.

## `FacetName`

The `FacetName` type is a union of strings representing all the valid facet names.

## `Facet<Name extends FacetName>`

The `Facet<Name>` type retrieves a specific `FacetDefinition` by name. For instance, `FacetDefinition<'PubHeaderTheme'>` is equivalent to `typeof PubHeaderTheme`. This is a convenience to reduce the number of places where we need to directly import a given facet definition.

## `FacetInstanceType<Def extends FacetDefinition>`

The `FacetInstanceType` type contains the (nullable) props of an indivudal **facet instance**. This corresponds to an object that we store in the database, associated with a single scope.

## `FacetValue<Def extends FacetDefinition>`

The `FacetValue` type contains the (possibly nullable) props of a **facet value**. This is the result of cascading values from all of a scopes's parents to determine the current value of a facet's props at that scope.

# Cascading, nullability, and root values

Here's a simplified example of a facet cascade. We have three `FacetInstance<T>` objects from different scopes, and we will use them to produce a `FacetValue<T>` holding the cascaded value:

```ts
// Using an imaginary, simplified cascade() function
const cascadedValue = cascade([
	{ backgroundImage: null, backgroundColor: '#0f0', textStyle: 'white-blocks' }, // From Community
	{ backgroundImage: null, backgroundColor: '#00f', textStyle: 'dark' }, // From Collection
	{ backgroundImage: 'test.png', backgroundColor: null, textStyle: 'light' }, // From Pub
]);
```

Partially evaluated, the cascade looks a little like this:

```ts
// Using an imaginary, simplified cascadeProp() function
{
    backgroundImage: cascadeProp([null, null, "test.png"]),
    backgroundColor: cascadeProp(["#0f0", "#00f", null]),
    textStyle: cascadeProp(["white-blocks", "dark", "light"]),
}
```

The result of this cascade is:

```ts
{
    backgroundImage: "test.png",
    backgroundColor: "#00f",
    textStyle: "light",
}
```

Which is pretty intuitive — _cascading_ is just selecting from the lowest scope having a non-`null` value.

## `null` means "cascade through me"

As the value for a facet prop, `null` is a special signal. It means _there's no value here — use the value cascaded from my parent scopes_. All `FacetInstance` prop values are nullable _(not optional)_.

Here is a screenshot of an actual facet prop in the PubPub UI. Clicking the `[x]` button in the corner sets the value of the `PubHeaderTheme` facet instance for this scope to `null`:

<img width="405" src="https://user-images.githubusercontent.com/2208769/214855522-7be6a5a7-3964-447f-b291-f57d55b07df9.png">

Before we clicked the button, the prop editor said _Defined here_. Clicking the button set the prop value to `null`. And now, it says _Defined by Community_, and displays a value cascaded from the Community scope:

<img width="405" src="https://user-images.githubusercontent.com/2208769/214855523-fa4aad6d-ce99-43e9-948f-f3f7db503a8a.png">

For things to work this way, **props on facet instances must always nullable**. You can see that from our type definitions:

```ts
// If the `typeof` here catches you off guard, remember that PubHeaderTheme
// is a facet definition -- a JS runtime object.
FacetInstance<typeof PubHeaderTheme> = {
    backgroundImage: null | string;
    backgroundColor: null | string;
    textStyle: null | 'light' | 'dark' | ...;
};
```

This sounds like a nuisance to work with, but remember that most code outside of the facets library will be working with cascaded **facet values** instead of **facet instances**. And we have a trick up our sleeve to eliminate most nulls in this context.

## Root values for props

You'll commonly see _PubPub Default_ as the source of a facet prop:

<img width="405" src="https://user-images.githubusercontent.com/2208769/214855519-399ae3b3-1660-4a74-adf0-e9e503b15c27.png">

What we call _PubPub Default_ in user-facing copy is actually the `rootValue` from the facet prop definition. You can imagine the root values for each prop forming a facet instance in some imaginary "root scope" that cascades values down to all Communities. That's how it's implemented, too. Here are the props definitions for `PubHeaderTheme`:

```ts
{
    backgroundImage: prop(string, { rootValue: null }),
    backgroundColor: prop(string, { rootValue: 'community' }),
    textStyle: prop(textStylePropType, { rootValue: 'light' }),
}
```

We interpret this as an additional layer of values at the top of the cascade:

```ts
// Using an imaginary, simplified cascade() function
const cascadedValue = cascade([
    { backgroundImage: null, backgroundColor: 'community', textStyle: 'light' } // From root values
    { backgroundImage: null, backgroundColor: "#0f0", textStyle: "white-blocks" }, // From Community
    { backgroundImage: null, backgroundColor: "#00f", textStyle: "dark" }, // From Collection
    { backgroundImage: "test.png", backgroundColor: null, textStyle: "light" }, // From Pub
]);
```

Setting a non-null `rootValue` for a prop will narrow its type so it can logically never be null:

```ts
// Facet instances have all-nullable props.
FacetInstance<typeof PubHeaderTheme> = {
    backgroundImage: null | string;
    backgroundColor: null | string;
    textStyle: null | 'light' | 'dark' | ...;
};

// Accounting for cascading, and root values, facet values may have fewer nullable props.
FacetValue<typeof PubHeaderTheme> = {
    backgroundImage: null | string;
    backgroundColor: string;
    textStyle: 'light' | 'dark' | ...;
};
```

## There's more to know about cascading

See the [section on `cascade()`](#cascade) for the full story on how this function really works, and [Advanced: cascade strategies](#advanced-cascade-strategies) for additional context on how the `cascade()` to learn how to cascade values from scope to scope in other ways, e.g. by appending them to an array instead of overwriting them.

# Utilities to create, parse, and cascade facets

> ⚠️ This section serves as an API overview for some of the more internal parts of the Facets system. It's good to know about these functions, but you probably won't have to use them in day-to-day code.

All of these functions take a `definition` as an argument — one of the `FacetDefinition` instances exported from `facets/definitions`. **They are also isomorphic, pure, and runtime-agnostic** — they don't persist anything, only create and manipulate vanilla JS objects.

## `createEmptyFacetInstance`

```ts
createEmptyFacetInstance<Def extends FacetDefinition>(definition: Def): FacetInstance<Def>
```

This creates a facet instance for `definition` where all the prop values are set to `null`.

## `createFacetInstance`

```ts
createFacetInstance<Def extends FacetDefinition>(
    definition: Def,
    values: Partial<FacetInstance<Def>>,
): FacetInstance<Def>
```

This creates a facet instance for `definition`, with the `values` that you pass along for its props, and `null` for any other props. If you look carefully you'll see that this function does...almost nothing, because facet instances are vanilla JS objects. :)

## `parseFacetInstance`

```ts
parseFacetInstance<Def extends FacetDefinition>(
    definition: Def,
    instance: Record<keyof Def['props'], any>,
    throwErrorOnInvalidProps: boolean = false,
): ParseResult<Def> throws FacetParseError
```

This looks at the `instance` object (which could be anything) and parses it into an object with `{ valid, invalid }` properties:

-   `valid` contains a `Partial<FacetInstance<Def>>` with the part of the given `instance` with valid prop values.
-   `invalid` contains any invalid values from `instance`.

The function throws a `FacetParseError` if there are missing keys in `instance`. If `throwErrorOnInvalidProps` is set, the function will throw a `FacetParseError` if there are any props in `invalid`.

If `throwErrorOnInvalidProps = true` and no error is thrown, it is statically known that `valid` is a full and complete `FacetInstance<Def>`.

## `parsePartialFacetInstance`

```ts
parsePartialFacetInstance<Def extends FacetDefinition>(
    definition: Def,
    instance: Record<keyof Def['props'], any>,
    throwErrorOnInvalidProps: boolean = false,
): ParseResult<Def> throws FacetParseError
```

This works just like `parseFacetInstance` except it does not throw a `FacetParseError` if there are keys missing from `instance`. Parsing a partial facet is useful when receiving updates to its value from the client.

## `cascade`

```ts
cascade<Def extends FacetDefinition>(
    definition: Def,
    stack: FacetInstanceStack<Def>,
): FacetCascadeResult<Def>
```

This is the real version of the toy `cascade` function introduced earlier. Using it requires a `FacetInstanceStack<Def>` which is a heavy piece of machinery:

```ts
type FacetSourceScope = { kind: 'community' | 'collection' | 'pub'; id: string } | { kind: 'root' };

type FacetInstanceStack = {
	scope: FacetSourceScope;
	facetBindingId: null | string;
	value: FacetInstance<Def>;
}[];
```

A lot going on there, but you can basically think of it as _an array of `FacetInstance<Def>` associated with information about what scope those instances belong to_. (Note the fake `root` scope we discussed above!)

The return value is just as hefty:

```ts
type FacetCascadeResult = {
	value: FacetValue<Def>;
	props: { [K in keyof Def['props']]: FacetPropCascadeResult<Def['props'][K]> };
	stack: FacetInstanceStack<Def>;
};
```

The important bit here is the `value: FacetValue<Def>` that's returned. But some callers are also interested in the `props` object, which breaks down how each prop in the facet ended up cascading. And it returns its own `stack` argument for convenience.

## `mapFacet`

```ts
mapFacet<Def extends FacetDefinition>(
    definition: Def,
    mapper: (key: keyof Def['props'], prop: FacetProp) => T,
): Record<keyof Def['props'], T>
```

This is a convenience function to generate new objects in the shape of a facet's props without an unpleasant round-trip through `Object.entries()` and `Object.fromEntries()`. The `mapper` function gets a prop's name and definition, and can return whatever it wants.

# Facet instances in the database

When the PubPub server starts, it constructs a Sequelize model for each `FacetDefinition` that we export from `facets/definitions`. These very quickly turn into plain old database tables. These tables for a given facet definition `Def` hold objects of type `FacetInstance<Def>`, **so it's appropriate to call the entries of these tables "facet instances"**. Here's the one for `PubHeaderTheme`:

```sql
CREATE TABLE "PubHeaderTheme" (
    "backgroundImage" text,
    "backgroundColor" text,
    "textStyle" character varying,
    id uuid PRIMARY KEY,
    "facetBindingId" uuid NOT NULL REFERENCES "FacetBindings"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);
```

_These models are exported on the `facetModels` object in `server/models`. But you'll rarely need to work with them directly._

We have columns for:

-   A unique primary key
-   The three actual facet props `{ backgroundImage, backgroundColor, textStyle }`
-   The `{ createdAt, updatedAt }` that Sequelize helpfully adds to tables
-   A `facetBindingId`. Hmm, what's that?

## The `FacetBindings` table

Each facet instance is associated with a scope using a layer of indirection called `FacetBinding`:

```ts
type FacetBinding = {
	communityId: null | string;
	collectionId: null | string;
	pubId: null | string;
	id: string;
};
```

By convention, only one of `{ communityId, collectionId, pubId }` is non-null. So, facet instances attach to a scope by attaching to a `FacetBinding` with a reference to that scope. here's how this works for an instance of the `License` facet:

`[Pub] --(FacetBinding.pubId)--> [FacetBinding] --(License.facetBindingId)--> [License]`

Or equivalently as psuedo-SQL:

```sql
SELECT Pub
JOIN FacetBindings ON Pub.id = FacetBindings.pubId
JOIN License ON License.facetBindingId = FacetBindings.id
```

> ℹ️ Aside: this extra layer of indirection presents a design tradeoff. Queries would be faster if we joined facet tables (e.g. `License`) directly to scope tables (e.g. `Pub`). But as Facets evolves, there may be more information to store about a facet instance's relationship to a scope:
>
> -   Is it enabled?
> -   Is it part of a Release?
> -   Does it apply to this scope, or only this scope's children?
>
> ...which could be a lot to store directly on the facet instance tables. This is the basis on which the `FacetBinding` design was chosen.

## Migrations for facet definitions

Facet tables face a usual limitations of Sequelize models: migrations must be written by hand. Specifically, this means:

-   A file in `tools/migrations` should imperatively add/remove columns from the relevant table in concert with the facet schema change in `facets/definitions`.
-   A file in the `tools/migrations/data` may need to specify a data migration, to backfill values into the new column.

We might consider writing an automated system for this (and thus for Sequelize in general), or eventually moving to a different ORM with better migration tooling that Facets can tap into.

# Working with facets on the backend

## Reading facets as part of a normal request

The ubiquitous `ScopeData` type has an optional `facets` property. If you're already using either `getInitialData` or `getScope`, you can direct these functions to also return all _cascaded_ facet values. This is most appropriate when you really do need _all_ facet values, for instance because you intend to pass them down to the client.

### Via `getInitialData`

Just pass `includeFacets` into the second argument:

```ts
const initialData = await getInitialData(req, { includeFacets: true });
```

If you pass `isDashboard`, the function assumes `includeFacets: true`.

Then read `initialData.scopeData.facets`.

### Via `getScope`

Just pass `includeFacets: true` in the options object:

```ts
const scopeData = await getScope({
	pubId: whatever.pubId,
	includeFacets: true,
});
```

then read `scopeData.facets`.

## Fetching specific facets, or facets for many scopes

If you don't need all facet values, or you need the facet values for many scopes at once, you can import these utility functions from `server/facets`. Note that these return _cascaded_ values — you don't have to do any work to build a tree of scopes and cascade the values yourself.

### `fetchFacetsForScope`

```ts
fetchFacetsForScope(
    scopeId: SingleScopeId,
    facetNames?: string[],
): Promise<Record<string, FacetCascadeResult>>
```

The `SingleScopeId` type is defined in `types/scope.ts`:

```ts
type SingleScopeId = { communityId: string } | { pubId: string } | { collectionId: string };
```

The return value of this function is a record mapping facet names to `FacetCascadeResult` values (these are discussed in some detail in [the documentation for `cascade()`](#cascade). It would look a little like this:

```ts
{
    PubHeaderTheme: { /* Cascade result */ },
    License: { /* Cascade result */ },
    // ...
}
```

### `fetchFacetsForScopeIds`

```ts
fetchFacetsForScopeIds(
    scopeIds: Partial<ByScopeKind<string[]>>,
    facetNames?: string[],
): Promise<ByScopeKind<Record<string, FacetCascadeResult>>>
```

The `ByScopeKind<T>` type asks you to break down your inputs by scope kind:

```ts
const scopeIds: Partial<ByScopeKind<string[]>> = {
	// These are implied to be Pub IDs
	pub: ['a5b02ab4-16d4-4242-a091-cedb0fefc602', 'd3b593db-8388-4d9a-b933-435d268d8f0e'],
	// These are implied to be Community IDs
	community: ['7243a1cc-c66d-4878-8a6f-9202cce5215d'],
	// We can omit Collection IDs since this is a partial record
};
```

The function returns cascade results in a similar `ByScopeKind` format:

```ts
{
    pub: {
        'a5b02ab4-16d4-4242-a091-cedb0fefc602': {
            PubHeaderTheme: { /* Cascade result */ },
            License: { /* Cascade result */ },
            // ...
       },
       'd3b593db-8388-4d9a-b933-435d268d8f0e': {
            PubHeaderTheme: { /* Cascade result */ },
            License: { /* Cascade result */ },
            // ...
       },
    },
    community: {
       '7243a1cc-c66d-4878-8a6f-9202cce5215d': {
            PubHeaderTheme: { /* Cascade result */ },
            License: { /* Cascade result */ },
            // ...
       },
    },
}
```

## Updating facets for a single scope

This function is also available from `server/facets`.

### `updateFacetsForScope`

```ts
updateFacetsForScope(
    scopeId: SingleScopeId,
    update: Record<string, Partial<FacetInstance>>,
): Promise<void>
```

Like `fetchFacetsForScope`, this takes a `SingleScopeId` to identify the target of the update. The `update` parameter is a record which maps facet names to prop updates. So you can update individual props on multiple facets at once, like this:

```ts
{
    PubHeaderTheme: {
        textStyle: "black-blocks",
    },
    License: {
        kind: 'cc-0',
        copyrightSelection: {
            choice: 'choose-here',
            year: 1972,
        },
    },
}
```

Behind the scenes, `updateFacetsForScope` validates your input, and only updates props whose value conforms to their `propType`. Invalid props are swallowed silently.

# Working with facets on the frontend

The Facets system uses single a [`zustand`](https://github.com/pmndrs/zustand) store as the source of truth for facets state _(for a single scope)_ on the frontend. This store lives inside a `<FacetsStateProvider>` component at the root of the app. Its data comes from `initialData.scopeData.facets` that the server provides — so if the route you're working in does not provide `includeFacets: true` (or `isDashboard: true`) then the store will be unavailable.

The `useFacetsState` and `useFacetsQuery` hooks are available to interact with this store.

## `useFacetsState`

> ℹ️ You might not need to use this hook directly:
>
> -   If only want to _read_ a facet value, use `useFacetsQuery` instead.
> -   If you want to let users _update_ a facet value, you should strongly consider using the `<FacetEditor>` component.

This hook provides the following API (with some generics smoothed over):

```ts
type FacetsState = {
    // A mapping from facet names to state records:
    facetsState: Record<string, {
        // The definition for an individual facet
        facetDefinition: FacetDefinition;
        // The value of the facet as the server sees it
        persistedCascadeResult: FacetCascadeResult;
        // The value of the facet as the rest of the client sees it
        cascadeResult: FacetCascadeResult;
        // The value of the facet as the store sees it, which may include
        // invalid prop values (e.g. partial values held during input)
        latestAndPossiblyInvalidCascadeResult: FacetCascadeResult;
        // All changes that we can send to the server
        persistableChanges: Partial<FacetInstance>;
        // Any props that currently have an invalid value
        invalidProps: Partial<Record<string, true>>;
        // Whether there are invalid changes
        hasInvalidChanges: boolean;
        // Whether there are persistable changes
        hasPersistableChanges: boolean;
        // Whether this facet's value is being persisted to the server.
        isPersisting: boolean;
    }>;
    // Whether _any_ facet has persistable changes.
    hasPersistableChanges: boolean;
    // Whether _any_ facet's value is persisting.
    isPersisting: boolean;
    // The scope whose facets we're working with.
    currentScope: {
        kind: 'community' | 'collection' | 'pub',
        id: string;
    };
    // Updates a facet value
    updateFacet(
        name: string,
        patch: Partial<FacetInstance>,
    ) => void;
    // Persists all pending updates to the server
    persistFacets: () => Promise<void>;
}
```

This is a lot of detail — it's mostly accessed by the `<FacetEditor>` component.

## `useFacetsQuery`

```ts
useFacetsQuery<T>(
    facetsQuery: FacetsQuery<T>,
    options?: FacetsQueryOptions<T>,
): T throws Error
```

This is much easier to understand with a few examples:

```ts
const pubHeaderTheme = useFacetsQuery((F) => F.PubHeaderTheme);

const copyrightYear = useFacetsQuery((F) => F.License.copyrightSelection.year!);

const { imageLabel, videoLabel } = useFacetsQuery((F) => {
	return {
		imageLabel: F.NodeLabels.image,
		videoLabel: F.NodeLabels.video,
	};
});
```

The `facetsQuery` function takes an argument (typically named `F`) containing a `Record<string, FacetValue>`: the cascaded values for all facets. You can do whatever you want with that argument:

-   Return it directly
-   Return a single facet value
-   Return another value derived from one or more facet values

This query-style API is inspired by, and designed to hook into, Zustand's API for slicing small values out of large state stores for more efficient updates. Therefore, you should try to query minimal, even scalar, values from the facets store to prevent unnecessary React updates.

This hook takes a `FacetsQueryOptions<T>` value, which you may not need to use:

```ts
type FacetsQueryOptions<T> = {
	fallback?: () => T;
	level?: 'persisted' | 'current' | 'latest';
};
```

`fallback` provides a fallback value in the same shape that `facetsQuery` returns. You should provide this if you're building a reusable component that might be rendered on a page where `initialData.scopeData.facets` is not provided (and the store is thus unavailable). Otherwise, the hook will throw an error.

`levels` describes a level of "real-timeness" for the value. Its options are:

-   `persisted`: the facet state persisted to the server. Reads from `persistedCascadeResult` in the store.
-   `current`: the latest valid facet state on the client. Reads from `cascadeResult` in the store. _(Default)_
-   `latest`: the latest (and possible invalid) facet state on the client. Reads from `latestAndPossiblyInvalidCascadeResult` in the store.

`current` is the default — so if you don't provide an options object, you'll get _valid_ facet prop values, possibly with unsaved changes.

## The `<FacetEditor>` component

This is `<FacetEditor>`. You may recognize it from the Settings tab of the dashboard.

<img width="300" src="https://user-images.githubusercontent.com/2208769/216369534-abc3c11d-0601-4846-97fb-20573b75e564.png">

This is also `<FacetEditor>`, in its `selfContained` look and feel:

<img width="300" src="https://user-images.githubusercontent.com/2208769/216369854-73a41bc7-36c8-4097-a681-a2abfdd5067b.png" />

If you're building UI that lets users update a facet value, you're encouraged to give them a `<FacetEditor>` instance to work with. This provides a consistent look and feel for updating facets, including feedback about where values are cascading from. The basic API is dead simple:

```ts
<FacetEditor facetName="MyFacetName" selfContained>
```

With these props:

```ts
type FacetEditorProps = {
	facetName: string;
	// Use a compact visual style with a spinner -- appropriate for popovers.
	selfContained?: boolean;
};
```

## Usage with `<PopoverButton>`

It's common use in conjunction with our `PopoverButton` from `components`:

```ts
<PopoverButton
	component={() => <FacetEditor facetName="License" selfContained />}
	placement="top-end"
	aria-label="Edit license"
>
	<AccentedIconButton aria-label="Edit Pub license" icon="edit" accentColor={iconColor} />
</PopoverButton>
```

## Adding an editor for a new facet

To let `<FacetEditor>` work with a facet, you'll use the `createFacetKindEditor` to tell it about the facet, and tell it which components should be used to edit its props.

### Using `createFacetKindEditor`

```ts
createFacetEditor<Def extends FacetDefinition>(
    def: Def,
    options: {
        propEditors: {
            [K in keyof Def['props']]: PropTypeEditorComponent<
                Def['props'][K]['propType']
            >;
        }
    }
): React.Component
```

This is not _quite_ as scary as it seems at first. Consider a specific use:

```ts
// PubHeaderTheme.tsx

export default createFacetKindEditor(PubHeaderTheme, {
	propEditors: {
		backgroundImage: BackgroundImagePicker,
		backgroundColor: BackgroundColorPicker,
		textStyle: TextStylePicker,
	},
});
```

All we're doing is mapping the facet's props to specific components, like `BackgroundImagePicker`. This component explicitly declares its props:

```ts
type Props = FacetPropEditorProps<Facet<'PubHeaderTheme'>, 'backgroundColor'>;
```

Your new facet editors should follow this pattern exactly — it will help constrain TypeScript errors to convenient places (like the prop editor component body) as you work. In practice, your component editors will receive these props:

-   `value: T` — holds the current prop value
-   `onUpdateValue: (update: T) => void` — lets you update the value.

### Registering your new editor component with `<FacetEditor>`

The `createFacetKindEditor` function returns a React component, which is later imported into `FacetEditor.tsx` and added to this record:

```ts
const editorsForFacets = {
	CitationStyle: CitationStyleEditor,
	PubEdgeDisplay: PubEdgeDisplayEditor,
	PubHeaderTheme: PubHeaderThemeEditor,
	// ...
};
```

Once you do this, you'll be able to edit this facet's props using `<FacetEditor facetName="MyNewFacetName">`.

### Why does it work this way?

The `createFacetKindEditor` function that returns a `React.Component` for a specific facet might seem a little abstract. But it does quite a bit of plumbing to ensure that all facet editors work the same way. In particular, it renders each provided prop editor into a `<FacetPropEditorSkeleton>` with visual information about that prop's cascade status, and it folds all of these into a `<GenericFacetEditor>` that provides a consistent look and feel.

In the future, we could even use a set of generic prop editors to automatically generate editor UI for new facets:

```ts
const automaticallyGenerateFacetEditor = (def: FacetDefinition) => {
	return createFacetKindEditor(
		def,
		mapFacet(def, (key, prop) => guessBestPropEditor(prop.propType)),
	);
};
```

There are a few such generic prop editors already in `client/components/FacetEditor/propTypeEditors`.

# Advanced: Cascade strategies

Recall that there is a `cascade: CascadeStrategy` option available when creating a facet prop with `prop()`. We haven't used it at all throughout this guide — and, in fact, the production Facets system doesn't use it at all. But there are actually two "cascade strategies" we can use for props:

-   `overwrite`: values from lower scopes overwrite those from higher scopes
-   `concat`: values from lower scopes are concatenated to higher scopes as `[...higher, ...lower]`

As this implies, the `concat` strategy can only be used for props whose `propType` matches an array — for instance, using `arrayOf(string)` from pieces we find in `primitives.ts`. We don't use this anywhere yet, but it could be really powerful for things like attributions, which should cascade additively from higher scopes to lower ones.

There was a third strategy, `merge`, under consideration, which cascaded as `{ ...higher, ...lower }`. This seemed unlikely to be used, as it duplicates the behavior of facet props within a facet. If you find yourself looking for it, you might consider moving values from out of your `propType` into the `props` of your new facet.

# Sketch: improving bulk facet load performance with archetypes

_See [Are facets the right choice for my new feature?](#are-facets-the-right-choice-for-my-new-feature) for more context on this section._

Imagine that we want to facet-ize the following Pub properties:

-   `title`
-   `description`
-   `attributions`
-   `previewImage`

These are all loaded for each Pub in a Page or Collection layout, so loading these facets for hundreds of Pubs needs to be fast. Here are two reasons this might be too slow:

-   We must load `FacetInstances` for all the Pubs' parent scopes (Collections and Communities) to produce the correct, cascaded `FacetValue`
-   The `FacetInstances` are spread across many small tables which must be individually joined.

Ideally, we'd store the pre-cascaded values for each of these facets in a _single table_ that can be referenced when these facets need to be loaded. Taking [overt inspiration](https://rust-tutorials.github.io/entity-component-scrapyard/03-Archetypes/archetype-explanation.html) from [Entity Component system](https://en.wikipedia.org/wiki/Entity_component_system) architecture, let's call this a "facet archetype".

We want our archetypes to inherit the guarantees around type-safety, runtime-agnosticism, and validation that individual facets have. So let's introduce an `archetype()` function in the `facets/core` directory. It might be used like this:

```ts
// We are in a hypothetical facets/archetypes/pubInLayout.ts
import { Title, Description, Attributions, PreviewImage } from 'facets/definitions';

export const PubInLayout = archetype({
	facets: [Title, Description, Attributions, PreviewImage],
	scopes: ['pub'],
});
```

This has type:

```ts
FacetArchetypeValue<typeof PubInLayout> = {
    Title: FacetCascadedType<typeof Title>,
    Description: FacetCascadedType<typeof Description>,
    Attributions: FacetCascadedType<typeof Attributions>,
    PreviewImage: FacetCascadedType<typeof PreviewImage>,
}
```

Our server-side function `createSequelizeModelsFromFacetDefinitions` would then read from the `facets/archetypes` directory to create a new table for each archetype. This table would flatten the props of the constituent facets in a predictable way, e.g. turning `PreviewImage.url` into a column called `PreviewImage__url`.

When it creates this table, this function can also reference the tables it's created for each individual facet, and automatically generate Sequelize hooks to recompute the archetype row whenever one of its dependency facets updates.

An _extremely_ loose sketch:

```ts
const dependencyFacetNames = ['Title', 'Description', 'Attributions', 'PreviewImage'];

dependencyFacetNames.forEach((facetName) => {
	const FacetModel = facetModels[facetName];
	// Also include .afterCreate and .afterDestroy equivalents...
	FacetModel.afterUpdate((title) => {
		const facetBinding = await FacetBinding.findOne({
			where: { id: title.facetBidingId },
		});
		const pubs = await getChildPubsIncludingSelfForScopeIds(facetBinding);
		// In reality, do all this in parallel:
		for (const pub of pubs) {
			const currentFacetValues = await fetchFacetsForScope(
				{ pubId: pub.id },
				dependencyFacetNames,
			);
			await facetArchetypes.PubInLayout.update(
				// This would turn e.g. `url` into `PreviewImage__url`.
				prefixKeysForArchetype(PubInLayout, currentFacetValues),
				{ where: { pubId: pub.id } },
			);
		}
	});
});
```

Something like this would keep the `PubInLayout` table up to date for a given Pub. _(More work would need to be done to handle creation and deletion of facet instance rows, recomputing `PubInLayout` rows from scratch, etc.)_.

The last step would be to modify `fetchFacetsForScope` to detect that an archetype table can be used when these facet values are being loaded. Everything downstream of this function wouldn't need to know anything about archetype tables — they'll just get their facets faster!
