## ActivityItem

<pre>
{
  id: string
  kind: <del style="background:red">"community-created" | "community-updated" | "collection-created" | "collection-updated" | "collection-removed" | "collection-pub-created" | "collection-pub-removed" | "facet-instance-updated" | ... 16 more ... | "submission-status-updated"</del><ins style="background:green">ActivityItemKind</ins>
  pubId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  payload: any<ins style="background:green"> | null</ins>
  timestamp: <del style="background:red">string</del><ins style="background:green">Date</ins>
  communityId: string
  actorId: string | null
  collectionId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Collection

<pre>
{
  id: string
  title: string<ins style="background:green"> | null</ins>
  slug: string
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  isRestricted: boolean<ins style="background:green"> | null</ins>
  isPublic: boolean<ins style="background:green"> | null</ins>
  viewHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  editHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  metadata<del style="background:red">?: { [k</del>: <ins style="background:green">Record<</ins>string<del style="background:red">]:</del><ins style="background:green">,</ins> any<ins style="background:green">> | null</ins>
  kind: <del style="background:red">CollectionKind</del><ins style="background:green">any | null</ins>
  doi<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  readNextPreviewSize: <del style="background:red">ReadNextPreviewSize</del><ins style="background:green">any</ins>
  layout: <del style="background:red">CollectionLayout</del><ins style="background:green">any</ins>
  layoutAllowsDuplicatePubs: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  pageId<del style="background:red">?:</del><ins style="background:green">:</ins> string | null
  communityId: string<ins style="background:green"> | null</ins>
  scopeSummaryId: string | null
  crossrefDepositRecordId<del style="background:red">?:</del><ins style="background:green">:</ins> string | null
  attributions?: CollectionAttribution[]
  <ins style="background:green">submissionWorkflow?: SubmissionWorkflow</ins>
  <ins style="background:green">collectionPubs?: CollectionPub[]</ins>
  <ins style="background:green">members?: Member[]</ins>
  <ins style="background:green">page?: Page</ins>
  crossrefDepositRecord?: <del style="background:red">DepositRecord</del><ins style="background:green">CrossrefDepositRecord</ins>
  scopeSummary?: ScopeSummary
  community?: Community
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## CollectionAttribution

<pre>
{
  id: string
  name: string<ins style="background:green"> | null</ins>
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  title<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  order: number<ins style="background:green"> | null</ins>
  isAuthor<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  roles<del style="background:red">?:</del><ins style="background:green">:</ins> string[]<ins style="background:green"> | null</ins>
  affiliation<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  orcid<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  userId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  collectionId: string
  user?: MinimalUser
  <ins style="background:green">collection?: Collection</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## CollectionPub

<pre>
{
  id: string
  pubId: string
  collectionId: string
  contextHint<del style="background:red">?:</del><ins style="background:green">:</ins> string | null
  rank: string
  pubRank: string
  collection?: Collection
  pub?: Pub
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Commenter

<pre>
{
  id: string
  name: string<ins style="background:green"> | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Community

<pre>
{
  id: string
  subdomain: string
  domain<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  title: string
  citeAs<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  publishAs<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  description<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  favicon<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  accentColorLight: string<ins style="background:green"> | null</ins>
  accentColorDark: string<ins style="background:green"> | null</ins>
  hideCreatePubButton<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  headerLogo<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  headerLinks<del style="background:red">?:</del><ins style="background:green">:</ins> CommunityHeaderLink[]<ins style="background:green"> | null</ins>
  headerColorType<del style="background:red">?:</del><ins style="background:green">:</ins> <ins style="background:green">CreationOptional<</ins>"light" | "dark" | "custom"<ins style="background:green">></ins>
  useHeaderTextAccent<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  hideHero<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  hideHeaderLogo<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  heroLogo<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  heroBackgroundImage<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  heroBackgroundColor<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  heroTextColor<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  useHeaderGradient<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  heroImage<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  heroTitle<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  heroText<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  heroPrimaryButton<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">CommunityHeroButton</del><ins style="background:green">any | null</ins>
  heroSecondaryButton<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">CommunityHeroButton</del><ins style="background:green">any | null</ins>
  heroAlign<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  navigation: CommunityNavigationEntry[]<ins style="background:green"> | null</ins>
  hideNav<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  <ins style="background:green">navLinks: CommunityNavigationEntry[] | null</ins>
  footerLinks<del style="background:red">?:</del><ins style="background:green">:</ins> CommunityNavigationEntry[]<ins style="background:green"> | null</ins>
  footerLogoLink<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  footerTitle<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  footerImage<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  website<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  facebook<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  twitter<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  email<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  issn<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  isFeatured<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  viewHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  editHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  premiumLicenseFlag<del style="background:red">?:</del><ins style="background:green">:</ins> <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  defaultPubCollections: string[]<ins style="background:green"> | null</ins>
  spamTagId: string | null
  organizationId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  scopeSummaryId: string | null
  <ins style="background:green">organization?: Organization</ins>
  collections?: Collection[]
  pubs?: Pub[]
  pages?: Page[]
  depositTargets?: DepositTarget[]
  scopeSummary?: ScopeSummary
  spamTag?: SpamTag<del style="background:red"> | null</del>
  accentTextColor: string
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## CrossrefDepositRecord

<pre>
{
  id: string
  depositJson<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">any</del><ins style="background:green">object | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## DepositTarget

<pre>
{
  id: string
  communityId: string<ins style="background:green"> | null</ins>
  doiPrefix: string<ins style="background:green"> | null</ins>
  service: <ins style="background:green">CreationOptional<</ins>"crossref" | "datacite"<ins style="background:green">></ins>
  username: string<ins style="background:green"> | null</ins>
  password: string<ins style="background:green"> | null</ins>
  passwordInitVec: string<ins style="background:green"> | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
  <del style="background: red">isPubPubManaged?: boolean</del>
}</pre>

## Discussion

<pre>
{
  id: string
  title: string<ins style="background:green"> | null</ins>
  number: number
  isClosed: boolean<ins style="background:green"> | null</ins>
  labels: string[]<ins style="background:green"> | null</ins>
  threadId: string
  visibilityId: string
  userId: string<ins style="background:green"> | null</ins>
  <ins style="background:green">anchorId: string | null</ins>
  pubId: string<ins style="background:green"> | null</ins>
  <ins style="background:green">commenterId: string | null</ins>
  thread?: Thread
  visibility<del style="background:red">:</del><ins style="background:green">?:</ins> Visibility
  <ins style="background:green">author?: User</ins>
  <ins style="background:green">commenter?: Commenter</ins>
  pub?: Pub
  anchors?: DiscussionAnchor[]
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## DiscussionAnchor

<pre>
{
  id: string
  isOriginal: boolean
  discussionId: string
  historyKey: number
  selection: { type: "text"
  anchor: number
  head: number
  originalText: string
  originalTextPrefix: string
  originalTextSuffix: string
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Doc

<pre>
{
  id: string
  content: DocJson
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Draft

<pre>
{
  id: string
  latestKeyAt<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">string</del><ins style="background:green">Date | null</ins>
  firebasePath: string
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Export

<pre>
{
  id: string
  format: string
  url<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  historyKey: number
  <ins style="background:green">pubId: string</ins>
  workerTaskId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  <ins style="background:green">workerTask?: WorkerTask</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## ExternalPublication

<pre>
{
  id: string
  title: string
  url: string
  contributors<del style="background:red">?:</del><ins style="background:green">:</ins> string[]<ins style="background:green"> | null</ins>
  doi<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  description<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  publicationDate<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">string</del><ins style="background:green">Date | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## FeatureFlag

<pre>
{
  id: string
  name: string<ins style="background:green"> | null</ins>
  enabledUsersFraction: number
  enabledCommunitiesFraction: number
  users?: FeatureFlagUser[]
  communities?: FeatureFlagCommunity[]
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## FeatureFlagUser

<pre>
{
  id: string
  featureFlagId: string<ins style="background:green"> | null</ins>
  userId: string<ins style="background:green"> | null</ins>
  enabled: boolean<ins style="background:green"> | null</ins>
  user?: User
  <ins style="background:green">featureFlag?: FeatureFlag</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## FeatureFlagCommunity

<pre>
{
  id: string
  featureFlagId: string<ins style="background:green"> | null</ins>
  communityId: string<ins style="background:green"> | null</ins>
  enabled: boolean<ins style="background:green"> | null</ins>
  community?: Community
  <ins style="background:green">featureFlag?: FeatureFlag</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## ZoteroIntegration

<pre>
{
  id: string
  zoteroUsername: string<ins style="background:green"> | null</ins>
  zoteroUserId: string<ins style="background:green"> | null</ins>
  userId: string<ins style="background:green"> | null</ins>
  integrationDataOAuth1Id: string<ins style="background:green"> | null</ins>
  <ins style="background:green">user?: User</ins>
  <ins style="background:green">integrationDataOAuth1?: IntegrationDataOAuth1</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## IntegrationDataOAuth1

<pre>
{
  id: string
  accessToken: string<ins style="background:green"> | null</ins>
  <ins style="background:green">zoteroIntegration?: ZoteroIntegration</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
  <del style="background: red">integrationId: string</del>
  <del style="background: red">integration?: ZoteroIntegration</del>
}</pre>

## LandingPageFeature

<pre>
{
  id: string
  communityId: string | null
  pubId: string | null
  rank: string
  payload: Record<string, any> | null
  pub?: <del style="background:red">any | null</del><ins style="background:green">Pub</ins>
  community?: <del style="background:red">any | null</del><ins style="background:green">Community</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Member

<pre>
{
  id: string
  permissions: <del style="background:red">MemberPermission</del><ins style="background:green">any</ins>
  isOwner<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  subscribedToActivityDigest: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  userId: string
  pubId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  collectionId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  communityId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  organizationId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  user?: User
  <ins style="background:green">community?: Community</ins>
  <ins style="background:green">pub?: Pub</ins>
  <ins style="background:green">collection?: Collection</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Page

<pre>
{
  id: string
  title: string
  slug: string
  description: string | null
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  isPublic: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  isNarrowWidth<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  viewHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  layout: LayoutBlock[]
  layoutAllowsDuplicatePubs: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  communityId: string
  <ins style="background:green">community?: Community</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Pub

<pre>
{
  id: string
  slug: string
  title: string
  htmlTitle: string | null
  description<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  htmlDescription<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  customPublishedAt<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">string</del><ins style="background:green">Date | null</ins>
  doi: string | null
  labels<del style="background:red">?:</del><ins style="background:green">:</ins> <ins style="background:green">{ id: </ins>string<del style="background:red">[]</del>
  <ins style="background:green">color: string</ins>
  title: string
  <ins style="background:green">publicApply: boolean</ins>
  downloads<del style="background:red">?:</del><ins style="background:green">:</ins> any[]<ins style="background:green"> | null</ins>
  metadata<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">{}</del><ins style="background:green">object | null</ins>
  viewHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  editHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  reviewHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  commentHash<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  draftId<del style="background:red">?:</del><ins style="background:green">:</ins> string
  communityId: string
  crossrefDepositRecordId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  scopeSummaryId: string | null
  attributions<del style="background:red">:</del><ins style="background:green">?:</ins> PubAttribution[]
  collectionPubs?: CollectionPub[]
  community?: Community
  draft?: Draft
  discussions?: Discussion[]
  exports?: Export[]
  reviews?: <del style="background:red">Review</del><ins style="background:green">ReviewNew</ins>[]
  members?: Member[]
  releases<del style="background:red">:</del><ins style="background:green">?:</ins> Release[]
  pubVersions?: PubVersion[]
  outboundEdges?: <del style="background:red">OutboundEdge</del><ins style="background:green">Omit<PubEdge, "pub"></ins>[]
  inboundEdges?: <del style="background:red">InboundEdge</del><ins style="background:green">Omit<PubEdge, "targetPub"></ins>[]
  submission?: Submission
  crossrefDepositRecord?: <del style="background:red">DepositRecord</del><ins style="background:green">CrossrefDepositRecord</ins>
  scopeSummary<del style="background:red">:</del><ins style="background:green">?:</ins> ScopeSummary
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## PubAttribution

<pre>
{
  id: string
  name: string<ins style="background:green"> | null</ins>
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  title<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  order: number<ins style="background:green"> | null</ins>
  isAuthor<del style="background:red">?:</del><ins style="background:green">:</ins> boolean<ins style="background:green"> | null</ins>
  roles<del style="background:red">?:</del><ins style="background:green">:</ins> string[]<ins style="background:green"> | null</ins>
  affiliation<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  orcid<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  userId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  pubId: string
  user?: <del style="background:red">MinimalUser</del><ins style="background:green">User</ins>
  <ins style="background:green">pub?: Pub</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## PubEdge

<pre>
{
  id: string
  pubId: string
  externalPublicationId<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">number</del><ins style="background:green">string | null</ins>
  targetPubId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  relationType: string
  rank: string
  pubIsParent: boolean
  approvedByTarget: boolean
  pub?: Pub
  targetPub?: Pub
  externalPublication?: ExternalPublication
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## PubVersion

<pre>
{
  id: string
  historyKey<del style="background:red">?:</del><ins style="background:green">:</ins> number<ins style="background:green"> | null</ins>
  pubId<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  <ins style="background:green">pub?: Pub</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Release

<pre>
{
  id: string
  noteContent<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">{}</del><ins style="background:green">Record<string, any> | null</ins>
  noteText<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  pubId: string
  userId: string
  docId: string
  historyKey: number
  <ins style="background:green">historyKeyMissing: CreationOptional<boolean></ins>
  doc?: Doc
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## ScopeSummary

<pre>
{
  <ins style="background:green">id: string</ins>
  collections: number
  pubs: number
  discussions: number
  reviews: number
  submissions: number
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Submission

<pre>
{
  id: string
  status: <del style="background:red">any</del><ins style="background:green">SubmissionStatus</ins>
  submittedAt: <del style="background:red">string</del><ins style="background:green">Date</ins> | null
  submissionWorkflowId: string
  pubId: string
  abstract: <del style="background:red">any</del><ins style="background:green">object</ins> | null
  pub?: Pub
  submissionWorkflow?: SubmissionWorkflow
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## SpamTag

<pre>
{
  id: string
  status: <del style="background:red">SpamStatus</del><ins style="background:green">any</ins>
  statusUpdatedAt: <del style="background:red">string</del><ins style="background:green">Date</ins> | null
  fields: Record<string, <del style="background:red">string[]</del><ins style="background:green">any</ins>>
  spamScore: number
  spamScoreComputedAt: <del style="background:red">string</del><ins style="background:green">Date</ins>
  spamScoreVersion: number
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## SubmissionWorkflow

<pre>
{
  id: string
  title: string
  collectionId: string<ins style="background:green"> | null</ins>
  enabled: boolean
  instructionsText: <del style="background:red">DocJson</del><ins style="background:green">object</ins>
  acceptedText: DocJson
  declinedText: DocJson
  receivedEmailText: DocJson
  introText: DocJson
  targetEmailAddresses: string[]
  requireAbstract: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  requireDescription: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  <ins style="background:green">submissions?: Submission[]</ins>
  collection?: Collection
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Reviewer

<pre>
{
  id: string
  name: string<ins style="background:green"> | null</ins>
  <ins style="background:green">reviewId: string</ins>
  <ins style="background:green">review?: ReviewNew</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Thread

<pre>
{
  id: string
  <ins style="background:green">isLocked: boolean | null</ins>
  comments<del style="background:red">:</del><ins style="background:green">?:</ins> ThreadComment[]
  events<del style="background:red">:</del><ins style="background:green">?:</ins> ThreadEvent[]
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
  <del style="background: red">locked?: boolean</del>
}</pre>

## ThreadComment

<pre>
{
  id: string
  text: string<ins style="background:green"> | null</ins>
  content: <del style="background:red">DocJson</del><ins style="background:green">any | null</ins>
  userId: string | null
  threadId: string
  commenterId: string | null
  author?: User<del style="background:red"> | null</del>
  commenter?: Commenter<del style="background:red"> | null</del>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## ThreadEvent

<pre>
{
  id: string
  type<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  data<del style="background:red">?:</del><ins style="background:green">:</ins> <del style="background:red">{}</del><ins style="background:green">Record<string, any> | null</ins>
  userId: string
  threadId: string
  <ins style="background:green">user?: User</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## User

<pre>
{
  id: string
  slug<del style="background:red">?:</del><ins style="background:green">:</ins> string
  firstName: string
  lastName: string
  fullName: string
  initials: string
  avatar<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  bio: string<ins style="background:green"> | null</ins>
  title<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  email: string
  publicEmail<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  authRedirectHost<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  location: string<ins style="background:green"> | null</ins>
  website: string<ins style="background:green"> | null</ins>
  facebook: string<ins style="background:green"> | null</ins>
  twitter: string<ins style="background:green"> | null</ins>
  github: string<ins style="background:green"> | null</ins>
  orcid<del style="background:red">?:</del><ins style="background:green">:</ins> string<ins style="background:green"> | null</ins>
  googleScholar: string<ins style="background:green"> | null</ins>
  resetHashExpiration: <del style="background:red">number</del><ins style="background:green">Date | null</ins>
  resetHash: string<ins style="background:green"> | null</ins>
  <ins style="background:green">inactive: boolean | null</ins>
  <ins style="background:green">pubpubV3Id: number | null</ins>
  passwordDigest: string<ins style="background:green"> | null</ins>
  hash: string
  salt: string
  <ins style="background:green">gdprConsent: CreationOptional<boolean></ins>
  isSuperAdmin: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  <ins style="background:green">attributions?: PubAttribution[]</ins>
  <ins style="background:green">discussions?: Discussion[]</ins>
  <ins style="background:green">userNotificationPreferences?: UserNotificationPreferences</ins>
  <ins style="background:green">zoteroIntegration?: ZoteroIntegration</ins>
  isShadowUser?: boolean
  feedback?: string
  sha3hashedPassword: string
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## UserNotification

<pre>
{
  id: string
  userId: string
  userSubscriptionId: string
  activityItemId: string
  isRead: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  manuallySetIsRead: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  activityItem?: ActivityItem<ins style="background:green"><ActivityItemKind></ins>
  userSubscription?: UserSubscription
  user?: User
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## UserNotificationPreferences

<pre>
{
  id: string
  userId: string
  receiveNotifications: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  lastReceivedNotificationsAt: <del style="background:red">string</del><ins style="background:green">Date</ins> | null
  subscribeToThreadsAsCommenter: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  subscribeToPubsAsMember: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  subscribeToPubsAsContributor: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  notificationCadence: number
  markReadTrigger: <del style="background:red">UserNotificationMarkReadTrigger</del><ins style="background:green">any</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## UserScopeVisit

<pre>
{
  id: string
  userId: string<ins style="background:green"> | null</ins>
  pubId: string | null
  collectionId: string | null
  communityId: string<ins style="background:green"> | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## UserSubscription

<pre>
{
  id: string
  setAutomatically: boolean
  status: UserSubscriptionStatus
  userId: string
  pubId: string | null
  threadId: string | null
  <ins style="background:green">pub?: Pub</ins>
  <ins style="background:green">thread?: Thread</ins>
  <ins style="background:green">user?: User</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## Visibility

<pre>
{
  id: string
  access: <del style="background:red">VisibilityAccess</del><ins style="background:green">any</ins>
  users<del style="background:red">:</del><ins style="background:green">?:</ins> VisibilityUser[]
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>

## VisibilityUser

<pre>
{
  id: string
  userId: string
  visibilityId: string
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>
