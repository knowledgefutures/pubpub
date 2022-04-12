import { modelize, setup, teardown } from 'stubstub';
import { isUserAffiliatedWithCommunity } from 'server/community/queries';

const models = modelize`
    Community theCommunity {
        Member {
            permissions: "view"
            User communityMember {}
        }

        Collection {
            Member {
                permissions: "view"
                User collectionUser {}
            }

            CollectionAttribution {
                User collectionAttrUser {}
            }
        }

        Pub {
            Member {
                permissions: "view"
                User pubUser {}
            }

            PubAttribution {
                User pubAttrUser {}
            }
        }
    }

    Community {
        Member {
            permissions: "admin"
            User randoCommunityAdmin {}
        }

    }
    User notACommunityMember {}
`;

setup(beforeAll, models.resolve);
teardown(afterAll);

describe('isUserAffiliatedWithCommunity', () => {
	it('returns true if user is member of the community', async () => {
		const { theCommunity, communityMember } = models;

		expect(await isUserAffiliatedWithCommunity(communityMember.id, theCommunity.id)).toEqual(
			true,
		);
	});

	it('returns true if user is member of collection in the community', async () => {
		const { theCommunity, collectionUser } = models;
		expect(await isUserAffiliatedWithCommunity(collectionUser.id, theCommunity.id)).toEqual(
			true,
		);
	});

	it('returns true if user is member of pub in the community', async () => {
		const { theCommunity, pubUser } = models;
		expect(await isUserAffiliatedWithCommunity(pubUser.id, theCommunity.id)).toEqual(true);
	});

	it('returns true if user has a CollectionAttribution in the community', async () => {
		const { theCommunity, collectionAttrUser } = models;
		expect(await isUserAffiliatedWithCommunity(collectionAttrUser.id, theCommunity.id)).toEqual(
			true,
		);
	});

	it('returns true if user has a PubAttribution in the community', async () => {
		const { theCommunity, pubAttrUser } = models;
		expect(await isUserAffiliatedWithCommunity(pubAttrUser.id, theCommunity.id)).toEqual(true);
	});

	it('returns false if user is not in the community', async () => {
		const { theCommunity, notACommunityMember } = models;
		expect(
			await isUserAffiliatedWithCommunity(notACommunityMember.id, theCommunity.id),
		).toEqual(false);
	});

	it('returns false if user is an admin in another community but not in this community', async () => {
		const { theCommunity, randoCommunityAdmin } = models;
		expect(
			await isUserAffiliatedWithCommunity(randoCommunityAdmin.id, theCommunity.id),
		).toEqual(false);
	});
});
