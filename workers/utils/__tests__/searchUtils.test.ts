import { vi } from 'vitest';

import { determinize, modelize, setup, teardown } from 'stubstub';
import { fullDoc, plainDoc } from 'utils/storybook/data';

import { getPageSearchData, getPubSearchData } from '../searchUtils';

const subDomain = crypto.randomUUID();

const models = modelize`
    Community {
        title: "Test Community"
        subdomain: ${subDomain}
        Pub draftPub {
            title: "A Draft Pub"
            description: "You probably cannot see me"
            avatar: "shh.png"
            PubAttribution {
                User {}
            }
        }
        Pub releasedPub {
            title: "A Released Pub"
            description: "Hey look at me"
            avatar: "hello.png"
            PubAttribution {
                isAuthor: false
                order: 0.3
                User {}
            }
            PubAttribution {
                isAuthor: true
                order: 0.2
                User {
                    firstName: "First"
                    lastName: "Author"
                    fullName: "Second Author"
                }
            }
            PubAttribution {
                isAuthor: true
                order: 0.1
                User {
                    firstName: "First"
                    lastName: "Author"
                    fullName: "First Author"
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
            description: "You can put text or Pubs on me"
            slug: "test-page"
            avatar: "page.png"
        }
    }
`;

// this needs to be hoisted, you cannot mocke that imagedoc thing otherwise
// @ts-expect-error - this is  fine, vitest can deal with it
const { getPubDraftDoc } = await vi.hoisted(async () => {
	const imageDoc = await import('utils/storybook/data').then((module) => module.imageDoc);
	return {
		getPubDraftDoc: vi.fn().mockResolvedValue({ doc: imageDoc }),
	};
});

setup(beforeAll, async () => {
	await models.resolve();

	vi.mock('server/utils/firebaseAdmin', () => ({
		getPubDraftDoc,
	}));
});

teardown(afterAll, () => {
	vi.clearAllMocks();
	vi.resetAllMocks();
});

const determinizePubData = determinize([
	'avatar',
	'byline',
	'communityTitle',
	'description',
	'title',
	'content',
	'isPublic',
]);

const determinizePageData = determinize([
	'avatar',
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
