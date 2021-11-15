# Feature flags in PubPub

Feature flags can be used to selectively enable new features for certain Users or Communities. To a User viewing a Community, the value of a feature flag is always `true` (on) or `false` (off) —  this value can be set per User or Community, or the flag can be configured to allow a specific percentage of Users or Communities. A `FeatureFlag` is stored in the database and has these important properties:

- **`name: string`**: a short, camel-cased name like `submissions` or `newActivityDash`.
- **`enabledUsersFraction: number`**: a number between 0 and 1 dictating the fraction of Users for whom the flag will be set to `true`, based on their UUIDs. If this value is `0.5`, then it will be 50% of users.
- **`enabledCommunitiesFraction: number`**: likewise, a number between 0 and 1 dictating the fraction of Communities for whom the flag will be set to `true`.

When a User visits a Community, the value of each feature flag is computed independently in the following way:

- If the flag is forced off for _either_ the User or the Community, the flag will be disabled.
- If it's forced on for either model, the flag will be enabled.
- Otherwise, the user may or may not see the flag based on `enabledUsersFraction` and `enabledCommunitiesFraction`. This choice is deterministic based on the UUID of the Community and User.

Setting both `enabledUsersFraction` and `enabledCommunitiesFraction` will enable flags for users based on their UUID _or_ that of the Community they're visiting — so the likelihood of the flag being enabled will exceed either fraction. This can be hard to reason about, and you'll likely want to use one or the other depending on the nature of the feature behind the flag.

## Accessing feature flags

There are three ways to find the value of a feature flag:

- **On the client:** from the `featureFlags` property returned by the `usePageContext()` React hook.
- **On the server:** a typical non-API route will compute an `InitialData` object, and make all feature flags for the user's request available from `initialData.featureFlags`.
- **In an API route:** a typical API route will not compute an `InitialData` — in this case you can call `getFeatureFlagForUserAndCommunity()` to get the value of a single flag for this request. Prefer storing and passing down the return value of this function rather than calling it many times.

## Creating and managing feature flags

...happens in the devshell REPL:

```
# dev environment:
npm run tools devshell

# prod environment
PUBPUB_PRODUCTION=true npm run tools devshell
```

The following functions are made available in the devshell:

- `createFeatureFlag(name: string): Promise<FeatureFlagInterface>`
- `getFeatureFlag(name: string): Promise<FeatureFlagInterface>`
- `destroyFeatureFlag(name: string): Promise<void>`

The `FeatureFlagInterface` manipulates a single feature flag and has the following methods:

- `setEnabledUsersFraction(fraction: number): Promise<void>`
- `getEnabledUsersFraction(): Promise<number>`
- `setEnabledCommunitiesFraction(fraction: number): Promise<void>`
- `getEnabledCommunitiesFraction(): Promise<number>`
- `setCommunityOverride(subdomain: string, state: 'on' | 'off'): Promise<void>`
- `removeCommunityOverride(subdomain: string): Promise<void>`
- `setUserOverride(slug: string, state: 'on' | 'off'): Promise<void>`
- `removeUserOverride(slug: string): Promise<void>`
- `getCommunityOverrideStates(): Promise<Record<string, 'on' | 'off'>>`
- `getUserOverrideStates(): Promise<Record<string, 'on' | 'off'>>`

Note that the `'on' | 'off'` enum is used instead of a boolean in some cases to remove ambiguity about whether `false` means an override is disabled (not present) or disabled (forcing a flag off).

There are more methods not mentioned here for the mass manipulation of User and Community override states. These may be helpful for scripting.