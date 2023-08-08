## ActivityItem


```diff
id: string
- kind: "community-created" | "community-updated" | "collection-created" | "collection-updated" | "collection-removed" | "collection-pub-created" | "collection-pub-removed" | "facet-instance-updated" | ... 16 more ... | "submission-status-updated"
+ kind: ActivityItemKind
- pubId?: string
+ pubId: string | null
- payload: any
+ payload: any | null
- timestamp: string
+ timestamp: Date
communityId: string
actorId: string | null
- collectionId?: string
+ collectionId: string | null
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Collection


```diff
id: string
- title: string
+ title: string | null
slug: string
- avatar?: string
+ avatar: string | null
- isRestricted: boolean
+ isRestricted: boolean | null
- isPublic: boolean
+ isPublic: boolean | null
- viewHash?: string
+ viewHash: string | null
- editHash?: string
+ editHash: string | null
- metadata?: { [k: string]: any
+ metadata: Record<string, any> | null
- kind: CollectionKind
+ kind: any | null
- doi?: string
+ doi: string | null
- readNextPreviewSize: ReadNextPreviewSize
+ readNextPreviewSize: any
- layout: CollectionLayout
+ layout: any
- layoutAllowsDuplicatePubs: boolean
+ layoutAllowsDuplicatePubs: CreationOptional<boolean>
- pageId?: string | null
+ pageId: string | null
- communityId: string
+ communityId: string | null
scopeSummaryId: string | null
- crossrefDepositRecordId?: string | null
+ crossrefDepositRecordId: string | null
attributions?: CollectionAttribution[]
+ submissionWorkflow?: SubmissionWorkflow
+ collectionPubs?: CollectionPub[]
+ members?: Member[]
+ page?: Page
- crossrefDepositRecord?: DepositRecord
+ crossrefDepositRecord?: CrossrefDepositRecord
scopeSummary?: ScopeSummary
community?: Community
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## CollectionAttribution


```diff
id: string
- name: string
+ name: string | null
- avatar?: string
+ avatar: string | null
- title?: string
+ title: string | null
- order: number
+ order: number | null
- isAuthor?: boolean
+ isAuthor: boolean | null
- roles?: string[]
+ roles: string[] | null
- affiliation?: string
+ affiliation: string | null
- orcid?: string
+ orcid: string | null
- userId?: string
+ userId: string | null
collectionId: string
user?: MinimalUser
+ collection?: Collection
- createdAt: string
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## CollectionPub


```diff
id: string
pubId: string
collectionId: string
- contextHint?: string | null
+ contextHint: string | null
rank: string
pubRank: string
collection?: Collection
pub?: Pub
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Commenter


```diff
id: string
- name: string
+ name: string | null
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Community


```diff
id: string
subdomain: string
- domain?: string
+ domain: string | null
title: string
- citeAs?: string
+ citeAs: string | null
- publishAs?: string
+ publishAs: string | null
- description?: string
+ description: string | null
- avatar?: string
+ avatar: string | null
- favicon?: string
+ favicon: string | null
- accentColorLight: string
+ accentColorLight: string | null
- accentColorDark: string
+ accentColorDark: string | null
- hideCreatePubButton?: boolean
+ hideCreatePubButton: boolean | null
- headerLogo?: string
+ headerLogo: string | null
- headerLinks?: CommunityHeaderLink[]
+ headerLinks: CommunityHeaderLink[] | null
- headerColorType?: "light" | "dark" | "custom"
+ headerColorType: CreationOptional<"light" | "dark" | "custom">
- useHeaderTextAccent?: boolean
+ useHeaderTextAccent: boolean | null
- hideHero?: boolean
+ hideHero: boolean | null
- hideHeaderLogo?: boolean
+ hideHeaderLogo: boolean | null
- heroLogo?: string
+ heroLogo: string | null
- heroBackgroundImage?: string
+ heroBackgroundImage: string | null
- heroBackgroundColor?: string
+ heroBackgroundColor: string | null
- heroTextColor?: string
+ heroTextColor: string | null
- useHeaderGradient?: boolean
+ useHeaderGradient: boolean | null
- heroImage?: string
+ heroImage: string | null
- heroTitle?: string
+ heroTitle: string | null
- heroText?: string
+ heroText: string | null
- heroPrimaryButton?: CommunityHeroButton
+ heroPrimaryButton: any | null
- heroSecondaryButton?: CommunityHeroButton
+ heroSecondaryButton: any | null
- heroAlign?: string
+ heroAlign: string | null
- navigation: CommunityNavigationEntry[]
+ navigation: CommunityNavigationEntry[] | null
- hideNav?: boolean
+ hideNav: boolean | null
+ navLinks: CommunityNavigationEntry[] | null
- footerLinks?: CommunityNavigationEntry[]
+ footerLinks: CommunityNavigationEntry[] | null
- footerLogoLink?: string
+ footerLogoLink: string | null
- footerTitle?: string
+ footerTitle: string | null
- footerImage?: string
+ footerImage: string | null
- website?: string
+ website: string | null
- facebook?: string
+ facebook: string | null
- twitter?: string
+ twitter: string | null
- email?: string
+ email: string | null
- issn?: string
+ issn: string | null
- isFeatured?: boolean
+ isFeatured: boolean | null
- viewHash?: string
+ viewHash: string | null
- editHash?: string
+ editHash: string | null
- premiumLicenseFlag?: boolean
+ premiumLicenseFlag: CreationOptional<boolean>
- defaultPubCollections: string[]
+ defaultPubCollections: string[] | null
spamTagId: string | null
- organizationId?: string
+ organizationId: string | null
scopeSummaryId: string | null
+ organization?: Organization
collections?: Collection[]
pubs?: Pub[]
pages?: Page[]
depositTargets?: DepositTarget[]
scopeSummary?: ScopeSummary
- spamTag?: SpamTag | null
+ spamTag?: SpamTag
accentTextColor: string
- createdAt: string
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## CrossrefDepositRecord


```diff
id: string
- depositJson?: any
+ depositJson: object | null
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## DepositTarget


```diff
id: string
- communityId: string
+ communityId: string | null
- doiPrefix: string
+ doiPrefix: string | null
- service: "crossref" | "datacite"
+ service: CreationOptional<"crossref" | "datacite">
- username: string
+ username: string | null
- password: string
+ password: string | null
- passwordInitVec: string
+ passwordInitVec: string | null
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
- isPubPubManaged?: boolean
```



## Discussion


```diff
id: string
- title: string
+ title: string | null
number: number
- isClosed: boolean
+ isClosed: boolean | null
- labels: string[]
+ labels: string[] | null
threadId: string
visibilityId: string
- userId: string
+ userId: string | null
+ anchorId: string | null
- pubId: string
+ pubId: string | null
+ commenterId: string | null
thread?: Thread
- visibility: Visibility
+ visibility?: Visibility
+ author?: User
+ commenter?: Commenter
pub?: Pub
anchors?: DiscussionAnchor[]
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## DiscussionAnchor


```diff
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
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Doc


```diff
id: string
content: DocJson
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Draft


```diff
id: string
- latestKeyAt?: string
+ latestKeyAt: Date | null
firebasePath: string
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Export


```diff
id: string
format: string
- url?: string
+ url: string | null
historyKey: number
+ pubId: string
- workerTaskId?: string
+ workerTaskId: string | null
+ workerTask?: WorkerTask
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## ExternalPublication


```diff
id: string
title: string
url: string
- contributors?: string[]
+ contributors: string[] | null
- doi?: string
+ doi: string | null
- description?: string
+ description: string | null
- avatar?: string
+ avatar: string | null
- publicationDate?: string
+ publicationDate: Date | null
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## FeatureFlag


```diff
id: string
- name: string
+ name: string | null
enabledUsersFraction: number
enabledCommunitiesFraction: number
users?: FeatureFlagUser[]
communities?: FeatureFlagCommunity[]
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## FeatureFlagUser


```diff
id: string
- featureFlagId: string
+ featureFlagId: string | null
- userId: string
+ userId: string | null
- enabled: boolean
+ enabled: boolean | null
user?: User
+ featureFlag?: FeatureFlag
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## FeatureFlagCommunity


```diff
id: string
- featureFlagId: string
+ featureFlagId: string | null
- communityId: string
+ communityId: string | null
- enabled: boolean
+ enabled: boolean | null
community?: Community
+ featureFlag?: FeatureFlag
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## ZoteroIntegration


```diff
id: string
- zoteroUsername: string
+ zoteroUsername: string | null
- zoteroUserId: string
+ zoteroUserId: string | null
- userId: string
+ userId: string | null
- integrationDataOAuth1Id: string
+ integrationDataOAuth1Id: string | null
+ user?: User
+ integrationDataOAuth1?: IntegrationDataOAuth1
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## IntegrationDataOAuth1


```diff
id: string
- accessToken: string
+ accessToken: string | null
+ zoteroIntegration?: ZoteroIntegration
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
- integrationId: string
- integration?: ZoteroIntegration
```



## LandingPageFeature


```diff
id: string
communityId: string | null
pubId: string | null
rank: string
payload: Record<string, any> | null
- pub?: any | null
+ pub?: Pub
- community?: any | null
+ community?: Community
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Member


```diff
id: string
- permissions: MemberPermission
+ permissions: any
- isOwner?: boolean
+ isOwner: boolean | null
- subscribedToActivityDigest: boolean
+ subscribedToActivityDigest: CreationOptional<boolean>
userId: string
- pubId?: string
+ pubId: string | null
- collectionId?: string
+ collectionId: string | null
- communityId?: string
+ communityId: string | null
- organizationId?: string
+ organizationId: string | null
user?: User
+ community?: Community
+ pub?: Pub
+ collection?: Collection
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Page


```diff
id: string
title: string
slug: string
description: string | null
- avatar?: string
+ avatar: string | null
- isPublic: boolean
+ isPublic: CreationOptional<boolean>
- isNarrowWidth?: boolean
+ isNarrowWidth: boolean | null
- viewHash?: string
+ viewHash: string | null
layout: LayoutBlock[]
- layoutAllowsDuplicatePubs: boolean
+ layoutAllowsDuplicatePubs: CreationOptional<boolean>
communityId: string
+ community?: Community
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Pub


```diff
id: string
slug: string
title: string
htmlTitle: string | null
- description?: string
+ description: string | null
- htmlDescription?: string
+ htmlDescription: string | null
- avatar?: string
+ avatar: string | null
- customPublishedAt?: string
+ customPublishedAt: Date | null
doi: string | null
- labels?: string[]
+ labels: { id: string
+ color: string
title: string
+ publicApply: boolean
- downloads?: any[]
+ downloads: any[] | null
- metadata?: {}
+ metadata: object | null
- viewHash?: string
+ viewHash: string | null
- editHash?: string
+ editHash: string | null
- reviewHash?: string
+ reviewHash: string | null
- commentHash?: string
+ commentHash: string | null
- draftId?: string
+ draftId: string
communityId: string
- crossrefDepositRecordId?: string
+ crossrefDepositRecordId: string | null
scopeSummaryId: string | null
- attributions: PubAttribution[]
+ attributions?: PubAttribution[]
collectionPubs?: CollectionPub[]
community?: Community
draft?: Draft
discussions?: Discussion[]
exports?: Export[]
- reviews?: Review[]
+ reviews?: ReviewNew[]
members?: Member[]
- releases: Release[]
+ releases?: Release[]
pubVersions?: PubVersion[]
- outboundEdges?: OutboundEdge[]
+ outboundEdges?: Omit<PubEdge, "pub">[]
- inboundEdges?: InboundEdge[]
+ inboundEdges?: Omit<PubEdge, "targetPub">[]
submission?: Submission
- crossrefDepositRecord?: DepositRecord
+ crossrefDepositRecord?: CrossrefDepositRecord
- scopeSummary: ScopeSummary
+ scopeSummary?: ScopeSummary
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## PubAttribution


```diff
id: string
- name: string
+ name: string | null
- avatar?: string
+ avatar: string | null
- title?: string
+ title: string | null
- order: number
+ order: number | null
- isAuthor?: boolean
+ isAuthor: boolean | null
- roles?: string[]
+ roles: string[] | null
- affiliation?: string
+ affiliation: string | null
- orcid?: string
+ orcid: string | null
- userId?: string
+ userId: string | null
pubId: string
- user?: MinimalUser
+ user?: User
+ pub?: Pub
- createdAt: string
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## PubEdge


```diff
id: string
pubId: string
- externalPublicationId?: number
+ externalPublicationId: string | null
- targetPubId?: string
+ targetPubId: string | null
relationType: string
rank: string
pubIsParent: boolean
approvedByTarget: boolean
pub?: Pub
targetPub?: Pub
externalPublication?: ExternalPublication
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## PubVersion


```diff
id: string
- historyKey?: number
+ historyKey: number | null
- pubId?: string
+ pubId: string | null
+ pub?: Pub
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Release


```diff
id: string
- noteContent?: {}
+ noteContent: Record<string, any> | null
- noteText?: string
+ noteText: string | null
pubId: string
userId: string
docId: string
historyKey: number
+ historyKeyMissing: CreationOptional<boolean>
doc?: Doc
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## ScopeSummary


```diff
+ id: string
collections: number
pubs: number
discussions: number
reviews: number
submissions: number
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Submission


```diff
id: string
- status: any
+ status: SubmissionStatus
- submittedAt: string | null
+ submittedAt: Date | null
submissionWorkflowId: string
pubId: string
- abstract: any | null
+ abstract: object | null
pub?: Pub
submissionWorkflow?: SubmissionWorkflow
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## SpamTag


```diff
id: string
- status: SpamStatus
+ status: any
- statusUpdatedAt: string | null
+ statusUpdatedAt: Date | null
- fields: Record<string, string[]>
+ fields: Record<string, any>
spamScore: number
- spamScoreComputedAt: string
+ spamScoreComputedAt: Date
spamScoreVersion: number
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## SubmissionWorkflow


```diff
id: string
title: string
- collectionId: string
+ collectionId: string | null
enabled: boolean
- instructionsText: DocJson
+ instructionsText: object
acceptedText: DocJson
declinedText: DocJson
receivedEmailText: DocJson
introText: DocJson
targetEmailAddresses: string[]
- requireAbstract: boolean
+ requireAbstract: CreationOptional<boolean>
- requireDescription: boolean
+ requireDescription: CreationOptional<boolean>
+ submissions?: Submission[]
collection?: Collection
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Reviewer


```diff
id: string
- name: string
+ name: string | null
+ reviewId: string
+ review?: ReviewNew
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Thread


```diff
id: string
+ isLocked: boolean | null
- comments: ThreadComment[]
+ comments?: ThreadComment[]
- events: ThreadEvent[]
+ events?: ThreadEvent[]
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
- locked?: boolean
```



## ThreadComment


```diff
id: string
- text: string
+ text: string | null
- content: DocJson
+ content: any | null
userId: string | null
threadId: string
commenterId: string | null
- author?: User | null
+ author?: User
- commenter?: Commenter | null
+ commenter?: Commenter
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## ThreadEvent


```diff
id: string
- type?: string
+ type: string | null
- data?: {}
+ data: Record<string, any> | null
userId: string
threadId: string
+ user?: User
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## User


```diff
id: string
- slug?: string
+ slug: string
firstName: string
lastName: string
fullName: string
initials: string
- avatar?: string
+ avatar: string | null
- bio: string
+ bio: string | null
- title?: string
+ title: string | null
email: string
- publicEmail?: string
+ publicEmail: string | null
- authRedirectHost?: string
+ authRedirectHost: string | null
- location: string
+ location: string | null
- website: string
+ website: string | null
- facebook: string
+ facebook: string | null
- twitter: string
+ twitter: string | null
- github: string
+ github: string | null
- orcid?: string
+ orcid: string | null
- googleScholar: string
+ googleScholar: string | null
- resetHashExpiration: number
+ resetHashExpiration: Date | null
- resetHash: string
+ resetHash: string | null
+ inactive: boolean | null
+ pubpubV3Id: number | null
- passwordDigest: string
+ passwordDigest: string | null
hash: string
salt: string
+ gdprConsent: CreationOptional<boolean>
- isSuperAdmin: boolean
+ isSuperAdmin: CreationOptional<boolean>
+ attributions?: PubAttribution[]
+ discussions?: Discussion[]
+ userNotificationPreferences?: UserNotificationPreferences
+ zoteroIntegration?: ZoteroIntegration
isShadowUser?: boolean
feedback?: string
sha3hashedPassword: string
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## UserNotification


```diff
id: string
userId: string
userSubscriptionId: string
activityItemId: string
- isRead: boolean
+ isRead: CreationOptional<boolean>
- manuallySetIsRead: boolean
+ manuallySetIsRead: CreationOptional<boolean>
- activityItem?: ActivityItem
+ activityItem?: ActivityItem<ActivityItemKind>
userSubscription?: UserSubscription
user?: User
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## UserNotificationPreferences


```diff
id: string
userId: string
- receiveNotifications: boolean
+ receiveNotifications: CreationOptional<boolean>
- lastReceivedNotificationsAt: string | null
+ lastReceivedNotificationsAt: Date | null
- subscribeToThreadsAsCommenter: boolean
+ subscribeToThreadsAsCommenter: CreationOptional<boolean>
- subscribeToPubsAsMember: boolean
+ subscribeToPubsAsMember: CreationOptional<boolean>
- subscribeToPubsAsContributor: boolean
+ subscribeToPubsAsContributor: CreationOptional<boolean>
notificationCadence: number
- markReadTrigger: UserNotificationMarkReadTrigger
+ markReadTrigger: any
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## UserScopeVisit


```diff
id: string
- userId: string
+ userId: string | null
pubId: string | null
collectionId: string | null
- communityId: string
+ communityId: string | null
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## UserSubscription


```diff
id: string
setAutomatically: boolean
status: UserSubscriptionStatus
userId: string
pubId: string | null
threadId: string | null
+ pub?: Pub
+ thread?: Thread
+ user?: User
- createdAt: string
+ createdAt?: any
- updatedAt: string
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## Visibility


```diff
id: string
- access: VisibilityAccess
+ access: any
- users: VisibilityUser[]
+ users?: VisibilityUser[]
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```



## VisibilityUser


```diff
id: string
userId: string
visibilityId: string
+ createdAt?: any
+ updatedAt?: any
+ deletedAt?: any
+ version?: any
```
