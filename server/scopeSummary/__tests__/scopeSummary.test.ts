import { setup, teardown, modelize } from 'stubstub';

import { Pub, Collection, Community, ScopeSummary } from 'server/models';

import { createPub } from 'server/pub/queries';
import { createDiscussion } from 'server/discussion/queries';
import { createReview } from 'server/review/queries';
import { DocJson } from 'types';

import { createCollectionPub } from 'server/collectionPub/queries';
import { summarizePub, summarizeCollection, summarizeCommunity } from '../queries';

const models = modelize`
    User chattyUser {}
    Visibility public {
        access: "public"
    }
    Community community {
        Collection c1 {
            CollectionPub {
                Pub p1 {
                    Discussion {
                        number: 1
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    Discussion {
                        number: 2
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    Discussion {
                        number: 3
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    ReviewNew {
                        number: 4
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                }
            }
            CollectionPub {
                Pub p2 {
                    Discussion {
                        number: 1
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    Discussion {
                        number: 2
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    ReviewNew {
                        number: 3
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    ReviewNew {
                        number: 4
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                }
            }
        }
        Collection c2 {
            CollectionPub {
                Pub p3 {
                    Discussion {
                        number: 1
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    ReviewNew {
                        number: 2
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                    ReviewNew {
                        number: 3
                        author: chattyUser
                        visibility: public
                        Thread {}
                    }
                }
            }
            CollectionPub {
                Pub p4 {}
            }
            CollectionPub {
                p1
            }
        }
        Pub p5 {
            Discussion {
                number: 1
                author: chattyUser
                visibility: public
                Thread {}
            }
            ReviewNew {
                number: 2
                author: chattyUser
                visibility: public
                Thread {}
            }
            ReviewNew {
                number: 3
                author: chattyUser
                visibility: public
                Thread {}
            }
        }
    }`;

setup(beforeAll, models.resolve);
teardown(afterAll);

beforeEach(() => ScopeSummary.destroy({ where: {} }));

const expectSummaryFor = async (scopeIds, expectedValues) => {
	const fetchModel = async () => {
		const { pubId, collectionId, communityId } = scopeIds;
		if (pubId) {
			const { scopeSummary } = await Pub.findOne({
				where: { id: pubId },
				include: [{ model: ScopeSummary, as: 'scopeSummary' }],
			});
			return scopeSummary;
		}
		if (collectionId) {
			const { scopeSummary } = await Collection.findOne({
				where: { id: collectionId },
				include: [{ model: ScopeSummary, as: 'scopeSummary' }],
			});
			return scopeSummary;
		}
		if (communityId) {
			const { scopeSummary } = await Community.findOne({
				where: { id: communityId },
				include: [{ model: ScopeSummary, as: 'scopeSummary' }],
			});
			return scopeSummary;
		}
		throw new Error('Invalid IDs provided to expectSummaryFor');
	};
	const model = await fetchModel();
	expect(model).toMatchObject(expectedValues);
};

describe('scopeSummary queries', () => {
	it('summarizes a Pub (and triggers summarization of parent scopes)', async () => {
		const { community, p1, c1, c2 } = models;
		await summarizePub(p1.id);
		await Promise.all([
			expectSummaryFor(
				{ pubId: p1.id },
				{ pubs: 0, collections: 0, discussions: 3, reviews: 1 },
			),
			expectSummaryFor({ collectionId: c1.id }, { pubs: 2, collections: 0 }),
			expectSummaryFor({ collectionId: c2.id }, { pubs: 3, collections: 0 }),
			expectSummaryFor({ communityId: community.id }, { pubs: 5, collections: 2 }),
		]);
	});

	it('summarizes a Collection', async () => {
		const { c1 } = models;
		await summarizeCollection(c1.id);
		await expectSummaryFor({ collectionId: c1.id }, { pubs: 2, collections: 0 });
	});

	it('summarizes a Community', async () => {
		const { community } = models;
		await summarizeCommunity(community.id);
		await expectSummaryFor({ communityId: community.id }, { pubs: 5, collections: 2 });
	});
});

describe('scopeSummary hooks', () => {
	it('creates a ScopeSummary automatically when a Pub is created (and updates the Community summary)', async () => {
		const { community } = models;
		const newPub = await createPub({ communityId: community.id });
		await Promise.all([
			expectSummaryFor({ pubId: newPub.id }, { reviews: 0, discussions: 0 }),
			expectSummaryFor({ communityId: community.id }, { pubs: 6, collections: 2 }),
		]);
	});

	it('updates ScopeSummaries when a Discussion is created', async () => {
		const { community, p1, c1, chattyUser } = models;
		await createDiscussion({
			pubId: p1.id,
			text: 'hi',
			content: {} as DocJson,
			historyKey: 0,
			visibilityAccess: 'members',
			initAnchorData: {
				exact: 'hi',
				from: 0,
				to: 0,
			},
			userId: chattyUser.id,
		});
		await Promise.all([
			expectSummaryFor({ pubId: p1.id }, { discussions: 4 }),
			expectSummaryFor({ collectionId: c1.id }, { pubs: 2, discussions: 4 }),
			expectSummaryFor(
				{ communityId: community.id },
				{ pubs: 6, collections: 2, discussions: 4 },
			),
		]);
	});

	it('updates ScopeSummaries when a Review is created', async () => {
		const { community, p2, c1, chattyUser } = models;
		await createReview({ pubId: p2.id, userData: chattyUser });
		await Promise.all([
			expectSummaryFor({ pubId: p2.id }, { reviews: 3 }),
			expectSummaryFor({ collectionId: c1.id }, { pubs: 2, reviews: 3 }),
			expectSummaryFor(
				{ communityId: community.id },
				{ pubs: 6, collections: 2, reviews: 3 },
			),
		]);
	});

	it('updates the ScopeSummary for a Collection when a Pub is added or removed', async () => {
		const { p2, c2 } = models;
		const collectionPub = await createCollectionPub({ pubId: p2.id, collectionId: c2.id });
		await expectSummaryFor({ collectionId: c2.id }, { pubs: 4 });
		await collectionPub.destroy();
		await expectSummaryFor({ collectionId: c2.id }, { pubs: 3 });
	});
});
