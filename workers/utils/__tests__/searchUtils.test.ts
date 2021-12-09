import { stub, modelize, setup, teardown, determinize } from 'stubstub';
import { plainDoc, fullDoc, imageDoc } from 'utils/storybook/data';

import { getPageSearchData, getPubSearchData } from '../searchUtils';

const models = modelize`
    Community {
        title: "Test Community"
        subdomain: "tc1"
        Pub draftPub {
            title: "A Draft Pub"
            slug: "a-draft-pub"
            description: "You probably cannot see me"
            avatar: "shh.png"
            PubAttribution {
                User {
                    slug: "test1"
                }
            }
        }
        Pub releasedPub {
            title: "A Released Pub"
            slug: "a-released-pub"
            description: "Hey look at me"
            avatar: "hello.png"
            PubAttribution {
                isAuthor: false
                order: 0.3
                User {
                    slug: "test3"
                }
            }
            PubAttribution {
                isAuthor: true
                order: 0.2
                User {
                    firstName: "First"
                    lastName: "Author"
                    fullName: "Second Author"
                    slug: "test4"
                }
            }
            PubAttribution {
                isAuthor: true
                order: 0.1
                User {
                    firstName: "First"
                    lastName: "Author"
                    fullName: "First Author"
                    slug: "test2"
                }
            }
            Release {
                createdAt: "2021-01-01"
                historyKey: 1
                Doc {
                    content: ${plainDoc}
                }
            }
            Release {
                createdAt: "2020-01-02"
                historyKey: 2
                Doc {
                    content: ${fullDoc}
                }
            }
        }
        Page testPage {
            title: "I am a test page"
            slug: "test-page"
            description: "You can put text or Pubs on me"
            avatar: "page.png"
        }
    }
`;

let firebaseStub;

setup(beforeAll, async () => {
	await models.resolve();
	firebaseStub = stub('server/utils/firebaseAdmin', {
		getPubDraftDoc: () => {
			return Promise.resolve({ doc: imageDoc });
		},
	});
});

teardown(afterAll, () => {
	firebaseStub.restore();
});

const determinizePubData = determinize([
	'avatar',
	'byline',
	'communityDomain',
	'communityTitle',
	'description',
	'slug',
	'title',
	'content',
	'isPublic',
]);

const determinizePageData = determinize([
	'avatar',
	'communityDomain',
	'communityTitle',
	'description',
	'slug',
	'title',
]);

describe('getPubSearchData', () => {
	it('produces the expected data for a draft Pub', async () => {
		const data = await getPubSearchData(models.draftPub.id);
		expect(data.map(determinizePubData)).toMatchSnapshot();
	});

	it('produces the expected data for a released Pub', async () => {
		const data = await getPubSearchData(models.releasedPub.id);
		expect(data.map(determinizePubData)).toMatchSnapshot();
	});
});

describe('getPageSearchData', () => {
	it('produces the expected data for a Page', async () => {
		const data = await getPageSearchData(models.testPage.id);
		expect(data.map(determinizePageData)).toMatchSnapshot();
	});
});
