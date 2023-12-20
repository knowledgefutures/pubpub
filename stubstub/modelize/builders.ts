import uuid from 'uuid';
import SHA3 from 'crypto-js/sha3';
import encHex from 'crypto-js/enc-hex';

import { createCollectionPub } from 'server/collectionPub/queries';
import {
	ActivityItem,
	Community,
	FacetBinding,
	Member,
	Release,
	SubmissionWorkflow,
	User,
	UserSubscription,
} from 'server/models';
import { createPub } from 'server/pub/queries';
import { createCollection } from 'server/collection/queries';
import { createDoc } from 'server/doc/queries';
import { createPage } from 'server/page/queries';
import { createCommunity } from 'server/community/queries';
import { getEmptyDoc } from 'client/components/Editor';
import {
	ActivityItem as ActivityItemType,
	Collection as CollectionType,
	UserWithPrivateFields as UserType,
	Pub as PubType,
	FacetBinding as FacetBindingType,
	DefinitelyHas,
} from 'types';
import { CreationAttributes } from 'sequelize';

type WithOptionalBase<
	T extends Record<string, any>,
	K extends keyof T | undefined = undefined,
> = K extends keyof T ? Omit<T, K> & Partial<T> : T;

/**
 * Allows properties which are optionally null to also be optionally undefined,
 * and allows you to specify extra optional properties.
 *
 * @example
 * ```ts
 * type MyType = { a: string; b: number; c: boolean | null; d: string | null; };
 *
 * type MyTypeWithNullAsAlsoUndefined = WithOptional<MyType>;
 * // { a: string; b: number; c: boolean | null | undefined; d: string | null | undefined; }
 *
 * type MyTypeWithNullAsAlsoUndefinedAndOptionalA = WithOptional<MyType, 'd'>;
 * // { a: string | undefined; b: number; c: boolean | null | undefined; d: string | null | undefined; }
 * ```
 *
 */
type WithOptional<
	/**
	 * The object type to operate on
	 */
	T extends Record<string, any>,
	/**
	 * @optional The keys to make optional
	 */
	K extends keyof T | undefined = undefined,
> = {
	[PossiblyNullKey in keyof WithOptionalBase<T, K>]: WithOptionalBase<
		T,
		K
	>[PossiblyNullKey] extends null
		? WithOptionalBase<T, K>[PossiblyNullKey] | undefined
		: WithOptionalBase<T, K>[PossiblyNullKey];
};

export const builders = {
	User: async (
		args?: WithOptional<UserType, 'firstName' | 'lastName' | 'email' | 'slug' | 'initials'> & {
			password?: string;
		},
	): Promise<User> => {
		const uniqueness = uuid.v4();
		const defaults = {
			firstName: 'Test',
			lastName: 'Testington',
			email: `testuser-${uniqueness}@email.su`,
			slug: uniqueness,
			password: 'password123',
		};

		const input = { ...defaults, ...args };

		const {
			firstName = 'Test',
			lastName = 'Testington',
			email = `testuser-${uniqueness}@email.su`,
			fullName = firstName + ' ' + lastName,
			slug = uniqueness,
			initials = firstName.slice(0, 1).toUpperCase() + lastName.slice(0, 1).toUpperCase(),
			password = 'password123',
			id,
			isSuperAdmin = false,
		} = input;

		const sha3hashedPassword = SHA3(password).toString(encHex);
		return new Promise((resolve, reject) => {
			User.register(
				{
					...(id && { id }),
					firstName,
					lastName,
					fullName,
					email,
					slug,
					initials,
					isSuperAdmin,
					passwordDigest: 'sha512',
				},
				sha3hashedPassword,
				(err, user) => {
					if (err || !user) {
						return reject(err);
					}
					// eslint-disable-next-line no-param-reassign
					user.sha3hashedPassword = sha3hashedPassword;
					return resolve(user);
				},
			);
		});
	},

	Community: async (
		args: { createFullCommunity: boolean } & WithOptional<
			CreationAttributes<Community>,
			'title' | 'subdomain' | 'navigation'
		>,
	) => {
		const { createFullCommunity, ...restArgs } = args;
		const unique = uuid.v4();
		const sharedArgs = {
			title: 'Community ' + unique,
			subdomain: unique,
			...restArgs,
		};
		if (createFullCommunity) {
			const admin = await builders.User();
			// @ts-expect-error FIXME: createCommunity only returns `subdomain`, but this leads to errors in modelize. Maybe let it return the whole community?
			return createCommunity({ ...sharedArgs }, admin, false) as Community;
		}
		return Community.create({
			navigation: [],
			...sharedArgs,
		});
	},

	Pub: async (args: { createPubCreator?: boolean } & WithOptional<PubType>) => {
		const { createPubCreator = true, ...pub } = args;
		const pubCreator = createPubCreator ? await builders.User() : undefined;
		return createPub(pub, pubCreator?.id);
	},

	Collection: ({
		title,
		kind,
		...restArgs
	}: DefinitelyHas<WithOptional<CollectionType, 'title' | 'kind'>, 'communityId'>) =>
		//	Omit<CollectionType, 'title' | 'kind'> & { title?: string; kind?: string }
		createCollection({
			title: title ?? 'Collection ' + uuid.v4(),
			kind: kind ?? 'issue',
			...restArgs,
		}),
	Page: createPage,

	Member: async ({
		pubId,
		collectionId,
		communityId,
		...restArgs
	}: WithOptional<CreationAttributes<Member>>) =>
		// {
		// 	pubId?: string;
		// 	collectionId?: string;
		// 	communityId?: string;
		//	}
		{
			const getTargetArgs = () => {
				// All of the enclosing scope IDs will be passed in, but we only want to associate a Member
				// with exactly one of a pub, collection, or community -- here, the least powerful scope.
				switch (true) {
					case !!pubId:
						return { pubId };
					case !!collectionId:
						return { collectionId };
					case !!communityId:
						return { communityId };
					default:
						return {};
				}
			};

			return Member.create({ ...getTargetArgs(), ...restArgs }, { hooks: false });
		},

	FacetBinding: async ({ pubId, collectionId, communityId, ...restArgs }: FacetBindingType) => {
		const getTargetArgs = () => {
			// All of the enclosing scope IDs will be passed in, but we only want to associate a
			// FacetBinding with one scope -- the lowest or "closest" one.
			switch (true) {
				case !!pubId:
					return { pubId };
				case !!collectionId:
					return { collectionId };
				case !!communityId:
					return { communityId };
				default:
					return {};
			}
		};

		return FacetBinding.create({ ...getTargetArgs(), ...restArgs });
	},

	Release: async (
		args: WithOptional<CreationAttributes<Release>, 'userId' | 'historyKey' | 'docId'>,
	) => {
		// The Release model requires these, but it doesn't currently associate them, so it's safe
		// to create random UUIDs for testing purposes.
		const { userId = uuid.v4(), historyKey = 0, docId = null, ...restArgs } = args;

		let resolvedDocId = docId;
		if (!resolvedDocId) {
			const fakeDoc = await createDoc({
				type: 'doc',
				content: [
					{
						type: 'paragraph',
						content: [{ type: 'text', text: 'test' }],
					},
				],
			});
			resolvedDocId = fakeDoc.id;
		}

		return Release.create({
			userId,
			historyKey,
			docId: resolvedDocId,
			...restArgs,
		});
	},

	CollectionPub: createCollectionPub,

	SubmissionWorkflow: (
		args: WithOptional<
			CreationAttributes<SubmissionWorkflow>,
			| 'enabled'
			| 'instructionsText'
			| 'introText'
			| 'receivedEmailText'
			| 'acceptedText'
			| 'declinedText'
			| 'targetEmailAddresses'
		>,
	) => {
		return SubmissionWorkflow.create({
			enabled: false,
			instructionsText: getEmptyDoc(),
			introText: getEmptyDoc(),
			receivedEmailText: getEmptyDoc(),
			acceptedText: getEmptyDoc(),
			declinedText: getEmptyDoc(),
			targetEmailAddresses: ['something@somewhere.com'],
			...args,
		});
	},

	ActivityItem: ({
		applyHooks = false,
		...activityItem
	}: {
		applyHooks?: boolean;
	} & ActivityItemType) => {
		return ActivityItem.create(activityItem, { hooks: applyHooks });
	},

	UserSubscription: (
		args: WithOptional<
			CreationAttributes<UserSubscription>,
			'pubId' | 'status' | 'setAutomatically'
		>,
	) => {
		const modifiedArgs = { ...args };
		// Modelize will try to associate this with a Pub if it's nested inside...
		// but in the case where there's also an associated Thread, we don't want this
		if (modifiedArgs.threadId) {
			delete modifiedArgs.pubId;
		}
		return UserSubscription.create({
			setAutomatically: false,
			status: 'active',
			...modifiedArgs,
		});
	},
};
