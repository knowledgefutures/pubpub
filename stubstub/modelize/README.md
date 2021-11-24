# Modelize

Modelize is a tool we use to quickly create interrelated database models for use in our tests. It relies on our Sequelize data model, and persists data to a real Postgres database.

## Motivation

Consider this fairly common scenario, which might be the setup for a unit or integration test in the PubPub codebase:


> _a Collection contains a Pub, which has a Member with `view` permissions_


Perhaps we could write this using helper functions like `createPub()`. We'd start by creating a Pub, but...oh, wait. Actually we need to create a Community first, but actually that Community needs an admin...

We'd repeat this process of unwinding the prerequisites for each model, and eventually arrive at something like this greatly simplified example:

```ts
const communityAdmin = await createUser('my-community-admin');
const community = await createCommunity(communityAdmin);
const collection = await createCollection(community);
const pubManager = await createUser('my-test-user');
const pub = await createPub(pubManager, community);
const collectionPub = await createCollectionPub(collection, pub);
const anotherUser = await createUser('another-test-user');
const pubViewMember = await createMember(anotherUser, pub, 'view');
```

Writing test setup code like this is painful for a few reasons:

- It requires importing a large number of `create` utilities for all of the relevant models, figuring out the right order to call them in, and providing irrelevant details like the `my-test-user` slug.
- It makes poor use of parallelism. In the example above, both `collection` and `pub` can be created at the same time, but this can be hard to spot and awkward to express with big `Promise.all` blocks of seemingly unrelated expressions. This slows down our tests.
- It has to be written in a Jest `beforeAll` or `beforeEach` block in a way that makes the models available in the global scope. Often this means writing a bunch of empty `let` definitions at the top of the file and then assigning to them later.
- It's difficult for readers of the code to understand the relationship between these models at a glance.

With `modelize`, we can express the same thing in the following way:

```ts
const models = modelize`
    Community {
        Collection collection {
            CollectionPub collectionPub {
                Pub pub {
                    Member pubViewMember {
                        permissions: 'view'
                        User anotherUser {}
                    }
                }
            }
        }
    }
`;
```

This has clear advantages, foremost among them that the nested hierarchy of the models becomes clear while an implementation detail (the order in which a bunch of `create` functions need to be called) fades into the background. Also note that a couple of models irrelevant to our test setup, such as the `User` required to instantiate a Community, are created behind the scenes for us, and populated with bogus data.

## Using Modelize in a test file

Here's a handy template for test files that use Modelize:

```ts
/* global describe, it, expect, beforeAll */
import { modelize, setup } from 'stubstub';

// Specify the models we want to use in our tests
const models = modelize`
    Community myCommunity {
        subdomain: 'hello'
    }
`;

// Actually create the models in Postgres
setup(beforeAll, async () => {
    await models.resolve();
});

// Run some tests
describe('my thing', () => {
    it('uses a model for something', async () => {
        const { myCommunity } = models;
        expect(myCommunity.subdomain).toEqual('hello');
    });
});
```

## Model properties

Within the modelize [tagged template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) we can write one or more model expressions which contain key-value pairs which are used to populate the database model:

```
ModelName instanceName {
    key: string | number | boolean | object | model
}
```

When it does not need to be referenced later, the `instanceName` can be omitted. It's possible and quite common to use a minimal model like this:

```
ModelName {}
```

To add a JavaScript object or array as a value you can interpolate it into the template string:

```ts
const navigation = [{title: "foo", href: "/foo"}];

const models = modelize`
    Community {
        navigation: ${navigation}
    }
`;
```

Depending on the model you want to work with, you may need to specify a number of properties or only a handful.

- Many fields in our Sequelize models are nullable and can be omitted
- Foreign key fields (IDs of other models) are set by nested models
- Some models have [builder functions](#Builders) which automatically populate instances with default or random data.

## Nesting and relating models

Models can be nested, and the nesting will be used to relate the models in an intuitive way:

```
Collection {
    kind: "issue"
    CollectionPub {
        rank: "a"
        Pub myPub {}
    }
}
```

Here, a Collection and a Pub are created, and associated with together (putting the Pub in the Collection) with a `CollectionPub` object. Let's take a closer look at what Modelize is doing to automatically create those relationships. Consider this excerpt from the `CollectionPub` model definition in `server/collectionPub/model.ts`:

```ts
CollectionPub.belongsTo(Pub, {
    onDelete: 'CASCADE',
    as: 'pub',
    foreignKey: 'pubId',
});
```

This line defines an _association_ between the `CollectionPub` and `Pub` models. `CollectionPub` has a foreign key column `pubId`, which holds the ID of a `Pub`. This relationship is given the name `pub`, which means that Sequelize will make the Pub with this ID available on a `CollectionPub` instance as `collectionPub.pub`.

Modelize makes extensive use of these associations to link models together. When you nest two models, Modelize will look for an association between the two (and complain if it doesn't find one). It will also attempt to create associations across more deeply-nested relationships. Consider the hypothetical `Baz` model used here:

```
Community someCommunity {
    Pub {
        Baz baz {}
    }
}
```

if `Baz` has a foreign key column `communityId` associated with the `Community` model, `baz.communityId` will be populated with the ID of `someCommunity`.

Within these constraints, nesting order does not matter too much — Modelize will find associations regardless of which model is the "parent" and which is the "child" in the nesting. This means that you could write:

```
Pub myPub {
    Community myCommunity {}
}
```

though you probably don't want to unless it reflects something important about your tests.

## Builders

The `stubstub/modelize/builders.js` file defines optional custom functions for each model which can be used to control how models are instantiated — for instance by adding default properties, selecting which Modelize-provided foreign keys to associate, or calling a completely custom creation query.