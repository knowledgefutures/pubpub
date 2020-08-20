/* global describe, it, expect, beforeAll, afterAll */
import { stub, modelize, setup, teardown, determinize } from 'stubstub';
import { plainDoc, fullDoc } from 'utils/storybook/data';

import { getPageSearchData, getPubSearchData } from '../searchUtils';

const models = modelize`
    Community {
        title: "Test Community"
        subdomain: "tc1"
        Pub shortPub {
            title: "A Short Pub"
            slug: "a-short-pub"
            description: "I am very brief"
            avatar: "short.png"
            PubAttribution {
                User {
                    slug: "test1"
                }
            }
        }
        Pub longPub {
            title: "A Long Pub"
            slug: "a-long-pub"
            description: "I am very lengthy"
            avatar: "long.png"
            PubAttribution {
                isAuthor: false
                User {
                    slug: "test3"
                }
            }
            PubAttribution {
                isAuthor: true
                User {
                    firstName: "First"
                    lastName: "Author"
                    fullName: "Second Author"
                    slug: "test4"
                }
            }
            PubAttribution {
                isAuthor: true
                User {
                    firstName: "First"
                    lastName: "Author"
                    fullName: "First Author"
                    slug: "test2"
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
		getBranchDoc: (pubId) => {
			return Promise.resolve({ doc: pubId === models.longPub.id ? fullDoc : plainDoc });
		},
	});
});

teardown(afterAll, () => {
	firebaseStub.restore();
});

const determinizePubData = determinize([
	'avatar',
	'branchIsPublic',
	'branchShortId',
	'byline',
	'communityDomain',
	'communityTitle',
	'description',
	'slug',
	'title',
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
	it('produces the expected data for a long Pub', async () => {
		const data = await getPubSearchData(models.longPub.id);
		expect(data.map(determinizePubData)).toMatchSnapshot();
	});

	it('produces the expected data for a short Pub', async () => {
		const data = await getPubSearchData(models.shortPub.id);
		expect(data.map(determinizePubData)).toMatchSnapshot();
	});
});

describe('getPageSearchData', () => {
	it('produces the expected data for a Page', async () => {
		const data = await getPageSearchData(models.testPage.id);
		expect(data.map(determinizePageData)).toMatchSnapshot();
	});
});
