Last validated: 2023-12-14

# Caching Strategy

This document briefly describes the caching strategy employed on PubPub.

## Overview

PubPub caches pages on Fastly that follow the following rules:

-   Do not match `req.url ~ "(/login|/logout|/auth|\?access=)" || req.url ~ "^/api/(pubs/.+/text|logout|userNotifications|uploadPolicy|citations|users|search/users|zoteroIntegration|editor|generateDoi|pubEdgeProposal|pubEdges|pubHistory|workerTasks)"`
-   Do not match `req.http.Cookie ~ "pp-lo"`. The `pp-lic = pp-lo` cookie is set when your'e logged out.

This means that public facing pages for non-logged in users are cached, as those make up the majority of traffic.

Pages are cached for a certain period of time (1 month) or until purged.

## Purging

Pages are tagged in Fastly with so called [`Surrogate-Keys`](https://docs.fastly.com/en/guides/purging-with-surrogate-keys).
Currently, we tag entire communities with their hostname, e.g. `jtrialerror.duqduq.org` for DuqDuq and `journal.trialanderror.org` for prod for the `jtrialerror` community. This is configured on Fastly.

In addition to the global surrogate key tag, there are two places where content from other communities is shown:

-   the `https://www.pubpub.org/user/*` pages. These feature Pubs from all communities the user is a member of, none of which are `www.pubpub.org`.

See https://github.com/pubpub/pubpub/blob/master/server/routes/user.tsx#L56-L58

-   Pubs with connections to Pubs from other communities

See https://github.com/pubpub/pubpub/blob/master/server/routes/pubDocument.tsx#L237-L238

These pages also get tagged with the hostname of the community they are from.

E.g., when a Pub on `jtrialerror.pubpub.org` has a connection to a Pub on `demo.pubpub.org`, you would get the header

```http
Surrogate-Key: jtrialerror.duqduq.org demo.pubpub.org
```

### Purging on changes

When _anything_ on the community changes, we send a request to fastly to purge the cache matching that tag, meaning all the pages will now miss and be served directly from the PubPub servers again.

While not very precise, this makes sure we do invalidate the cache when necessary and do not continue to serve outdated pages. While it is true that when users make changes, they usually make quite a few (create pub, update pub, add attributions, change facets, add members, etc.), leading to the cache being invalidated quite often, they usually do not make changes that frequently: they maybe add one pub and then leave it alone for a while. This means that the cache is still very effective, as most content goes untouched.

Purging happens in four places

#### Purge middleware

We have a middleware that is called on every request that checks if the request is a POST/PUT/PATCH/DELETE request and if so, purges the cache for the community the request is for.

It is defined here: https://github.com/pubpub/pubpub/blob/master/utils/caching/purgeMiddleware.ts#L1-L100

#### After workerTask completion

If you click "Export" or "Release", a/multiple export tasks are started.

After this export task has finished, a fresh Draft/Release page should receive the finished expor tasks as view data.

If we purged only after the `/api/release` or `/api/export` task had been called, we would purge before the task can update the database (it does not use the API), meaning the page would be served from the cache again, and the user would not see the updated view data.

https://github.com/pubpub/pubpub/blob/master/workers/queue.ts#L84-L86

#### Certain Model lifecycle hooks

Sometimes you might want to purge the cache when a certain model is created, updated or destroyed.

To do this you can use a very similar API as the activityHooks, called `createPurgeHooks`.

Almost all the current uses of this are to update the `/user/*` pages, or other places where the user is shown.

See https://github.com/pubpub/pubpub/blob/master/utils/caching/createPurgeHooks.ts

##### After PubAttribution is created, or a Release is created

Situation:

-   A user, Barbara, is created
-   Someone visits `www.pubpub.org/user/barbara`, seeing no pubs there, as Barbara has no pubs. This page will be cached with only Barbara's user-id, as there are 0 pubs on it.
-   Someone adds Barbara as author to a Pub.
-   We expect `www.pubpub.org/user/barbara` to now show the Pub, but it will not, as it is still cached.

In fact, `www.pubpub.org/user/barbara` will never be purged unless Barbara changes their user profile.

To counter this, we purge the cache for the user page whenever a PubAttribution is created or destroyed, that way we make sure that any update to "pubs that Barbara is an author of" will be reflected on the user page.

This does not need to happen when a PubAttribution is updated or destroyed, the following would happen

-   `www.pubpub.org/user/barbara` is either uncached or cached, with surrogate tags including the community the PubAttribution is for, so `<barbara-id> demo.pubpub.org`
-   A PubAttribution is updated or destroyed on `demo.pubpub.org`, sending a purge request for that
-   Barbara's user page is now uncached

###### Even more specific case

The above is valid when a user is added to an already published Pub, but we also need to purge when a Pub is published for the first time.

Problem workflow:

1. Add user which has no pubs in this community to a pub. This sends a purge request to the user page
2. Go to www.pubpub.org/user/<user-slug>. Cache miss, but no pub, because it isn't released.
3. Release Pub
4. Go back to www.pubpub.org/user/<user-slug>. Still no Pub, because this page isn't purged on release.
5. Remove and re-add user
6. Go back to www.pubpub.org/user/<user-slug>. Now the pub shows up.

##### User is modified

When a user updates their profile, we expect this to reflected anywhere their profile is visible.
E.g., imagine Barbara from before first did not have a profile picture, and now adds one.

This needs to be updated in the following places:

1. On every /user/barbara page, as the profile picture is shown there.
2. On every page where Barbara is shown as a member.
3. On every pub where Barbara is shown as an author.
4. On every logged-in page for Barbara themselves, they need to see their profile pic updated.

#### User notifications

TODO

### Debouncing

We make sure that we don't purge the cache for a community over and over, we debounce them.

We also throttle the total number of purges sent.

See https://github.com/pubpub/pubpub/blob/master/utils/caching/schedulePurge.ts#L1-L76
