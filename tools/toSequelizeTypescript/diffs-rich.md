## ActivityItem


<pre>
{
  id: string
  kind: <del style="background:red">"community-created" | "community-updated" | "collection-created" | "collection-updated" | "collection-removed" | "collection-pub-created" | "collection-pub-removed" | "facet-instance-updated" | ... 16 more ... | "submission-status-updated"</del><ins style="background:green">ActivityItemKind</ins>
  pubId?: string<ins style="background:green"> | null</ins>
  payload<del style="background:red">:</del><ins style="background:green">?:</ins> any<ins style="background:green"> | null</ins>
  timestamp: <del style="background:red">string</del><ins style="background:green">Date</ins>
  communityId: string
  actorId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  collectionId?: string<ins style="background:green"> | null</ins>
  createdAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  updatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>




## Collection


<pre>
{
  id: string
  title<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  slug: string
  avatar?: string<ins style="background:green"> | null</ins>
  isRestricted<del style="background:red">:</del><ins style="background:green">?:</ins> boolean<ins style="background:green"> | null</ins>
  isPublic<del style="background:red">:</del><ins style="background:green">?:</ins> boolean<ins style="background:green"> | null</ins>
  viewHash?: string<ins style="background:green"> | null</ins>
  editHash?: string<ins style="background:green"> | null</ins>
  metadata?: <del style="background:red">{</del><ins style="background:green">Record<string,</ins> <del style="background:red">[k:</del><ins style="background:green">any></ins> <del style="background:red">string]:</del><ins style="background:green">|</ins> <del style="background:red">any</del><ins style="background:green">null</ins>
  kind<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">CollectionKind</del><ins style="background:green">any | null</ins>
  doi?: string<ins style="background:green"> | null</ins>
  readNextPreviewSize<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">ReadNextPreviewSize</del><ins style="background:green">any</ins>
  layout: <del style="background:red">CollectionLayout</del><ins style="background:green">any</ins>
  layoutAllowsDuplicatePubs: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  pageId?: string | null
  communityId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  scopeSummaryId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  crossrefDepositRecordId?: string | null
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
  name<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  avatar?: string<ins style="background:green"> | null</ins>
  title?: string<ins style="background:green"> | null</ins>
  order<del style="background:red">:</del><ins style="background:green">?:</ins> number<ins style="background:green"> | null</ins>
  isAuthor?: boolean<ins style="background:green"> | null</ins>
  roles?: string[]<ins style="background:green"> | null</ins>
  affiliation?: string<ins style="background:green"> | null</ins>
  orcid?: string<ins style="background:green"> | null</ins>
  userId?: string<ins style="background:green"> | null</ins>
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
  contextHint?: string | null
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
  name<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
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
  domain?: string<ins style="background:green"> | null</ins>
  title: string
  citeAs?: string<ins style="background:green"> | null</ins>
  publishAs?: string<ins style="background:green"> | null</ins>
  description?: string<ins style="background:green"> | null</ins>
  avatar?: string<ins style="background:green"> | null</ins>
  favicon?: string<ins style="background:green"> | null</ins>
  accentColorLight<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  accentColorDark<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  hideCreatePubButton?: boolean<ins style="background:green"> | null</ins>
  headerLogo?: string<ins style="background:green"> | null</ins>
  headerLinks?: CommunityHeaderLink[]<ins style="background:green"> | null</ins>
  headerColorType?: <ins style="background:green">CreationOptional<</ins>"light" | "dark" | "custom"<ins style="background:green">></ins>
  useHeaderTextAccent?: boolean<ins style="background:green"> | null</ins>
  hideHero?: boolean<ins style="background:green"> | null</ins>
  hideHeaderLogo?: boolean<ins style="background:green"> | null</ins>
  heroLogo?: string<ins style="background:green"> | null</ins>
  heroBackgroundImage?: string<ins style="background:green"> | null</ins>
  heroBackgroundColor?: string<ins style="background:green"> | null</ins>
  heroTextColor?: string<ins style="background:green"> | null</ins>
  useHeaderGradient?: boolean<ins style="background:green"> | null</ins>
  heroImage?: string<ins style="background:green"> | null</ins>
  heroTitle?: string<ins style="background:green"> | null</ins>
  heroText?: string<ins style="background:green"> | null</ins>
  heroPrimaryButton?: <del style="background:red">CommunityHeroButton</del><ins style="background:green">any | null</ins>
  heroSecondaryButton?: <del style="background:red">CommunityHeroButton</del><ins style="background:green">any | null</ins>
  heroAlign?: string<ins style="background:green"> | null</ins>
  navigation<del style="background:red">:</del><ins style="background:green">?:</ins> CommunityNavigationEntry[]<ins style="background:green"> | null</ins>
  hideNav?: boolean<ins style="background:green"> | null</ins>
  <ins style="background:green">navLinks?: CommunityNavigationEntry[] | null</ins>
  footerLinks?: CommunityNavigationEntry[]<ins style="background:green"> | null</ins>
  footerLogoLink?: string<ins style="background:green"> | null</ins>
  footerTitle?: string<ins style="background:green"> | null</ins>
  footerImage?: string<ins style="background:green"> | null</ins>
  website?: string<ins style="background:green"> | null</ins>
  facebook?: string<ins style="background:green"> | null</ins>
  twitter?: string<ins style="background:green"> | null</ins>
  email?: string<ins style="background:green"> | null</ins>
  issn?: string<ins style="background:green"> | null</ins>
  isFeatured?: boolean<ins style="background:green"> | null</ins>
  viewHash?: string<ins style="background:green"> | null</ins>
  editHash?: string<ins style="background:green"> | null</ins>
  premiumLicenseFlag?: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  defaultPubCollections<del style="background:red">:</del><ins style="background:green">?:</ins> string[]<ins style="background:green"> | null</ins>
  spamTagId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  organizationId?: string<ins style="background:green"> | null</ins>
  scopeSummaryId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
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
  depositJson?: <del style="background:red">any</del><ins style="background:green">object | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>




## DepositTarget


<pre>
{
  id: string
  communityId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  doiPrefix<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  service<del style="background:red">:</del><ins style="background:green">?:</ins> <ins style="background:green">CreationOptional<</ins>"crossref" | "datacite"<ins style="background:green">></ins>
  username<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  password<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  passwordInitVec<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>




## Discussion


<pre>
{
  id: string
  title<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  number: number
  isClosed<del style="background:red">:</del><ins style="background:green">?:</ins> boolean<ins style="background:green"> | null</ins>
  labels<del style="background:red">:</del><ins style="background:green">?:</ins> string[]<ins style="background:green"> | null</ins>
  threadId: string
  visibilityId: string
  userId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  <ins style="background:green">anchorId?: string | null</ins>
  pubId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  <ins style="background:green">commenterId?: string | null</ins>
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
  selection<del style="background:red">:</del><ins style="background:green">?:</ins> { type: "text"
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
  latestKeyAt?: <del style="background:red">string</del><ins style="background:green">Date | null</ins>
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
  url?: string<ins style="background:green"> | null</ins>
  historyKey: number
  <ins style="background:green">pubId: string</ins>
  workerTaskId?: string<ins style="background:green"> | null</ins>
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
  contributors?: string[]<ins style="background:green"> | null</ins>
  doi?: string<ins style="background:green"> | null</ins>
  description?: string<ins style="background:green"> | null</ins>
  avatar?: string<ins style="background:green"> | null</ins>
  publicationDate?: <del style="background:red">string</del><ins style="background:green">Date | null</ins>
  <ins style="background:green">createdAt?: any</ins>
  <ins style="background:green">updatedAt?: any</ins>
  <ins style="background:green">deletedAt?: any</ins>
  <ins style="background:green">version?: any</ins>
}</pre>




## FeatureFlag


<pre>
{
  id: string
  name<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  enabledUsersFraction<del style="background:red">:</del><ins style="background:green">?:</ins> number
  enabledCommunitiesFraction<del style="background:red">:</del><ins style="background:green">?:</ins> number
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
  featureFlagId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  userId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  enabled<del style="background:red">:</del><ins style="background:green">?:</ins> boolean<ins style="background:green"> | null</ins>
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
  featureFlagId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  communityId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  enabled<del style="background:red">:</del><ins style="background:green">?:</ins> boolean<ins style="background:green"> | null</ins>
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
  zoteroUsername<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  zoteroUserId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  userId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  integrationDataOAuth1Id<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
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
  accessToken<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
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
  communityId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  pubId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  rank: string
  payload<del style="background:red">:</del><ins style="background:green">?:</ins> Record<string, any> | null
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
  permissions<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">MemberPermission</del><ins style="background:green">any</ins>
  isOwner?: boolean<ins style="background:green"> | null</ins>
  subscribedToActivityDigest: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  userId: string
  pubId?: string<ins style="background:green"> | null</ins>
  collectionId?: string<ins style="background:green"> | null</ins>
  communityId?: string<ins style="background:green"> | null</ins>
  organizationId?: string<ins style="background:green"> | null</ins>
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
  description<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  avatar?: string<ins style="background:green"> | null</ins>
  isPublic: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  isNarrowWidth?: boolean<ins style="background:green"> | null</ins>
  viewHash?: string<ins style="background:green"> | null</ins>
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
  htmlTitle<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  description?: string<ins style="background:green"> | null</ins>
  htmlDescription?: string<ins style="background:green"> | null</ins>
  avatar?: string<ins style="background:green"> | null</ins>
  customPublishedAt?: <del style="background:red">string</del><ins style="background:green">Date | null</ins>
  doi<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  labels?: string[]<ins style="background:green"> | null</ins>
  downloads?: any[]<ins style="background:green"> | null</ins>
  metadata?: <del style="background:red">{}</del><ins style="background:green">object | null</ins>
  viewHash?: string<ins style="background:green"> | null</ins>
  editHash?: string<ins style="background:green"> | null</ins>
  reviewHash?: string<ins style="background:green"> | null</ins>
  commentHash?: string<ins style="background:green"> | null</ins>
  draftId<del style="background:red">?:</del><ins style="background:green">:</ins> string
  communityId: string
  crossrefDepositRecordId?: string<ins style="background:green"> | null</ins>
  scopeSummaryId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
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
  name<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  avatar?: string<ins style="background:green"> | null</ins>
  title?: string<ins style="background:green"> | null</ins>
  order<del style="background:red">:</del><ins style="background:green">?:</ins> number<ins style="background:green"> | null</ins>
  isAuthor?: boolean<ins style="background:green"> | null</ins>
  roles?: string[]<ins style="background:green"> | null</ins>
  affiliation?: string<ins style="background:green"> | null</ins>
  orcid?: string<ins style="background:green"> | null</ins>
  userId?: string<ins style="background:green"> | null</ins>
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
  externalPublicationId?: <del style="background:red">number</del><ins style="background:green">string | null</ins>
  targetPubId?: string<ins style="background:green"> | null</ins>
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
  historyKey?: number<ins style="background:green"> | null</ins>
  pubId?: string<ins style="background:green"> | null</ins>
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
  noteContent?: <del style="background:red">{}</del><ins style="background:green">Record<string, any> | null</ins>
  noteText?: string<ins style="background:green"> | null</ins>
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
  submittedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">Date</ins> | null
  submissionWorkflowId: string
  pubId: string
  abstract<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">any</del><ins style="background:green">object</ins> | null
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
  statusUpdatedAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">Date</ins> | null
  fields: Record<string, <del style="background:red">string[]</del><ins style="background:green">any</ins>>
  spamScore: number
  spamScoreComputedAt: <del style="background:red">string</del><ins style="background:green">Date</ins>
  spamScoreVersion<del style="background:red">:</del><ins style="background:green">?:</ins> number
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
  collectionId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
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
  name<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
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
  <ins style="background:green">isLocked?: boolean | null</ins>
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
  text<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  content<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">DocJson</del><ins style="background:green">any | null</ins>
  userId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  threadId: string
  commenterId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
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
  type?: string<ins style="background:green"> | null</ins>
  data?: <del style="background:red">{}</del><ins style="background:green">Record<string, any> | null</ins>
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
  avatar?: string<ins style="background:green"> | null</ins>
  bio<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  title?: string<ins style="background:green"> | null</ins>
  email: string
  publicEmail?: string<ins style="background:green"> | null</ins>
  authRedirectHost?: string<ins style="background:green"> | null</ins>
  location<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  website<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  facebook<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  twitter<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  github<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  orcid?: string<ins style="background:green"> | null</ins>
  googleScholar<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  resetHashExpiration<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">number</del><ins style="background:green">Date | null</ins>
  resetHash<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  <ins style="background:green">inactive?: boolean | null</ins>
  <ins style="background:green">pubpubV3Id?: number | null</ins>
  passwordDigest<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  hash: string
  salt: string
  <ins style="background:green">gdprConsent?: CreationOptional<boolean></ins>
  isSuperAdmin: <ins style="background:green">CreationOptional<</ins>boolean<ins style="background:green">></ins>
  isShadowUser?: boolean
  feedback?: string
  sha3hashedPassword: string
  <ins style="background:green">attributions?: PubAttribution[]</ins>
  <ins style="background:green">discussions?: Discussion[]</ins>
  <ins style="background:green">userNotificationPreferences?: UserNotificationPreferences</ins>
  <ins style="background:green">zoteroIntegration?: ZoteroIntegration</ins>
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
  activityItem?: ActivityItem
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
  lastReceivedNotificationsAt<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">string</del><ins style="background:green">Date</ins> | null
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
  userId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
  pubId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  collectionId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  communityId<del style="background:red">:</del><ins style="background:green">?:</ins> string<ins style="background:green"> | null</ins>
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
  pubId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
  threadId<del style="background:red">:</del><ins style="background:green">?:</ins> string | null
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
  access<del style="background:red">:</del><ins style="background:green">?:</ins> <del style="background:red">VisibilityAccess</del><ins style="background:green">any</ins>
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

