## _What's in the box?_

This is code that turns PubPub entities (communities, collections, and pubs) into data that we can
submit to the DOI registry Crossref. This README is focused on a subset of the code that deals with
the Crossref schema, rather than the mechanics of actually submitting information to Crossref over
HTTP. We are working with reference to 
[version 4.4.1 of the Crossref schema](http://data.crossref.org/reports/help/schema_doc/4.4.1/index.html).
Note that the schema itself is in XML, but we use a JSON representation of XML while building
submissions because it's easier to manipulate in JavaScript.

## Wait, what's a DOI?

A DOI is a **D**igial **O**bject **I**dentifier -- a string in a certain format that is used to uniquely
and permanently identify objects. In practice, these objects are usually academic works, like books,
journal articles, or conference proceedings; sometimes they're artifacts (physical or digital)
referenced by these works. Crossref stores DOIs, along with associated metadata, and acts as a
clearinghouse for permanent records of scholarly works.

DOIs are namespaced. PubPub owns the namespace `10.21428` and everything hosted on PubPub gets a
submission DOI that starts with that string, though this is subject to change in the future.
Importantly, _PubPub is responsible for generating DOIs, not Crossref_. As long as the DOI is unique
and begins with our namespace identifier, Crossref will accept it.

## How is this code structured?

This directory has three important subdirectories:

- `transform/` contains code that transforms PubPub-specific entities into a set of more generic
  properties. It (mostly) decouples PubPub-specific implementation details from the Crossref schema.
- `schema/` contains code that generates Crossref schema entities. The Crossref schema is enormous,
  and we only implement a tiny subset of it. This code mostly doesn't know about PubPub-specific
  terminology -- it just takes some data and returns an object.
- `render/` ties the other two parts of the system together. It looks at PubPub-specific entities
  (specifically, pubs, collections, and communities), transforms them into some generic props, and
  uses those to generate schema entities that can be submitted to Crossref.

## Turning pubs into Crossref submissions

_Our submissions to Crossref always reference Pubs_, but they will make use of community and
collection-level data to add flavor and context. A pub will, by default, be submitted as if it's a
journal article that lives in a journal (in PubPub lingo, a community). But by passing a collection
object representing e.g. a book or a conference, we can submit the pub in those contexts too, e.g.
as a chapter or a conference paper, respectively.

By convention, we'll represent a pub in context using an object with this shape:

```
{globals, community, ?collection, ?collectionPub, pub}
```

This is mostly self-explanatory, but keep in mind:

- `globals` holds context that doesn't really belong to PubPub, like a submission timestamp.
- `collection` is optional. We can derive a Crossref submission for a pub that doesn't belong to any
  collection, or we can derive different submissions for the same pub by looking at it in the
  context of different collections.
- `collectionPub` is provided when there is a both a collection and a pub; it contains contextually
  useful information about the relationship between the two.

## Local code conventions

### `transform/`

Files in `transform/` should have a single default export which is a function. That function takes a
PubPub-specific entity as input and turns it into a more generic object that will serve as input to
a `schema/` entity. This is also where information that lives in multiple layers of the PubPub
hierarchy is "flattened". For instance, to resolve a URL for a Pub we need to know both its ID as
well as the name of its parent community. So by convention, `transform/` functions have a curried
signature that nests two functions. The first takes "context" (entities higher in the
`{globals, community, collection, pub}` hierarchy) and the second takes the object that's the
focus of the transformation.

```
pubPubContext => pubPubEntity => props
```

For instance, `pub.js` looks like this:

```
({community, globals}) => pub => ({ ... })
```

### `schema/`

Every file in `schema/` has a single default export which is a function. The function takes a set of
props, and generates an object from the Crossref schema. Let's look at a typical `schema` file.

```
// conference.js
export default ({ attributions, children, title, ...etc }) => ({
	conference: {
		event_metadata: {
			conference_name: title,
			...etc,
		},
		...contributors(attributions),
		...children,
	},
});
```

This file demonstrates some important conventions:

- The schema function is responsible for determining its own key! So `conference.js` returns an
  object with a single `conference` key, `doiData.js` returns one with `doi_data`, etc. To nest
  schema items, we thus use the `...` spread synax, as seen with `...contributors(attributions)`,
  which we understand will add a `contributors` key to the object being returned. This practice
  mirrors a convention in the Crossref schema where entities with the same shape almost always have
  the same key.
- An exception is the `date` schema which is referenced in different places as
  `publication_date`, `conference_date`, etc. It lives in a `helpers` package and generates its
  key from a positional argument, as in `...date('publication_date', publicationDate)`. Code that uses this pattern should live in `schema/helpers/`.
- Schema entities like `conference` that have deeply nested children should take a `children` prop
  and insert `...children` into their result. The code in `render/` that stitches these functions
  together is responsible for appropriate nesting.
