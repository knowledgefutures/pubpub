import { setup, modelize } from 'stubstub';
import { Pub, PubsQuery, PubsQueryOrdering } from 'types';

import { queryPubIds } from '../queryMany';

const models = modelize`
    Community otherCommunity {
        Pub ignoreMePub {}
    }
    User termUser {
        fullName: "Find This Guy"
    }
	User relatedUser {}
	SubmissionWorkflow submissionWorkflow {
		title: "A workflow"
	}
    Community community {
        Collection c1 {}
        Collection c2 {}
        Collection c3 {}
        Pub p1 {
            title: "1"
            CollectionPub {
                rank: "11"
                c1
            }
            CollectionPub {
                rank: "20"
                c2
            }
            PubAttribution {
                name: "Please Find"
            }
			PubAttribution {
				relatedUser
			}
			Submission {
				submissionWorkflow
				status: "accepted"
				submittedAt: "2021-12-01"
			}
        }
        Pub p2 {
            title: "2"
            CollectionPub {
                rank: "21"
                c2
            }
            CollectionPub {
                rank: "30"
                c3
            }
            PubAttribution {
                termUser
            }
			PubAttribution {
				relatedUser
			}
			Member {
				permissions: "admin"
				relatedUser
			}
			Submission {
				submissionWorkflow
				status: "declined"
				submittedAt: "2021-12-02"
			}
        }
        Pub p3 {
            title: "3"
            CollectionPub {
                rank: "10"
                c1
            }
            CollectionPub {
                rank: "31"
                c3
            }
            Release {
                createdAt: "2021-11-01"
            }
            Release {
                createdAt: "2021-12-02"
            }
            ReviewNew {
                number: 1
                Visibility {
                    visibility: "access"
                }
                Thread {}
                User {}
            }
			Submission {
				submissionWorkflow
				status: "received"
			}
        }
        Pub p4 {
            title: "4 Find 5 Furious"
            customPublishedAt: "2021-12-01"
            CollectionPub {
                rank: "32"
                c3
            }
            Release {
                createdAt: "2021-10-01"
            }
			Member {
				permissions: "admin"
				relatedUser
			}
        }
    }
`;

setup(beforeAll, models.resolve);

const titleOrdering: PubsQueryOrdering = {
	field: 'title',
	direction: 'ASC',
};

const publishDateOrdering: PubsQueryOrdering = {
	field: 'publishDate',
	direction: 'DESC',
};

const collectionRankOrdering: PubsQueryOrdering = {
	field: 'collectionRank',
	direction: 'ASC',
};

const expectPubIdsForQuery = async (query: Omit<PubsQuery, 'communityId'>, pubs: Pub[]) => {
	const ids = await queryPubIds({ ...query, communityId: models.community.id });
	expect(ids.length).toEqual(pubs.length);
	for (let i = 0; i < pubs.length; i++) {
		expect(pubs[i].id).toEqual(ids[i]);
	}
};

describe('queryPubIds', () => {
	it('Correctly scopes query to a Community', async () => {
		const { p1, p2, p3, p4 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering }, [p1, p2, p3, p4]);
	});

	it('Includes Pubs within certain Collections', async () => {
		const { p1, p2, p3, c1, c2 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, collectionIds: [c1.id, c2.id] }, [
			p1,
			p2,
			p3,
		]);
	});

	it('Excludes Pubs within certain Collections', async () => {
		const { p1, c3 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, excludeCollectionIds: [c3.id] }, [
			p1,
		]);
	});

	it('Excludes Pubs by ID', async () => {
		const { p1, p2, p3, p4 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, excludePubIds: [p1.id] }, [
			p2,
			p3,
			p4,
		]);
	});

	it('Filters within Pubs by ID', async () => {
		const { p2 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, withinPubIds: [p2.id] }, [p2]);
	});

	it('Filters for only released Pubs (sorting by publishDate)', async () => {
		const { p3, p4 } = models;
		await expectPubIdsForQuery({ ordering: publishDateOrdering, isReleased: true }, [p4, p3]);
	});

	it('Filters for only released Pubs', async () => {
		const { p1, p2 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, isReleased: false }, [p1, p2]);
	});

	it('Filters for only unreleased Pubs', async () => {
		const { p1, p2 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, isReleased: false }, [p1, p2]);
	});

	it('Filters for only Pubs with Reviews', async () => {
		const { p3 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, hasReviews: true }, [p3]);
	});

	it('Combines several filters', async () => {
		const { c3, p3, p4 } = models;
		await expectPubIdsForQuery(
			{
				ordering: titleOrdering,
				collectionIds: [c3.id],
				excludePubIds: [p3.id],
				isReleased: true,
			},
			[p4],
		);
	});

	it('Correctly limits and offsets a query', async () => {
		const { p2, p3 } = models;
		await expectPubIdsForQuery({ ordering: titleOrdering, limit: 2, offset: 1 }, [p2, p3]);
	});

	it('Scopes Pubs to a Collection and sorts them by collectionRank', async () => {
		const { c1, p1, p3 } = models;
		await expectPubIdsForQuery(
			{ ordering: collectionRankOrdering, scopedCollectionId: c1.id },
			[p3, p1],
		);
	});

	it('Filters for Pubs with certain submission statuses', async () => {
		const { p1, p2, p3 } = models;
		await expectPubIdsForQuery(
			{ ordering: titleOrdering, submissionStatuses: ['accepted', 'received'] },
			[p1, p3],
		);
		await expectPubIdsForQuery({ ordering: titleOrdering, submissionStatuses: ['declined'] }, [
			p2,
		]);
	});

	it('Orders Pubs by submission date', async () => {
		const { p1, p2, p3 } = models;
		await expectPubIdsForQuery({ ordering: { field: 'submittedDate', direction: 'DESC' } }, [
			p2,
			p1,
			p3,
		]);
		await expectPubIdsForQuery({ ordering: { field: 'submittedDate', direction: 'ASC' } }, [
			p1,
			p2,
			p3,
		]);
	});

	it('Filters for Pubs by a title or contributor term', async () => {
		const { p1, p2, p4 } = models;
		await expectPubIdsForQuery({ ordering: collectionRankOrdering, term: 'please' }, [p1]);
		await expectPubIdsForQuery({ ordering: collectionRankOrdering, term: 'guy' }, [p2]);
		await expectPubIdsForQuery({ ordering: collectionRankOrdering, term: 'find' }, [
			p1,
			p2,
			p4,
		]);
	});

	it('Filters for Pubs by related user ID (Member or attribution)', async () => {
		const { p1, p2, p4, relatedUser } = models;
		await expectPubIdsForQuery(
			{
				ordering: collectionRankOrdering,
				relatedUserIds: [relatedUser.id],
			},
			[p1, p2, p4],
		);
	});
});
