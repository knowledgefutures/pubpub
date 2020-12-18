/* global it, expect, beforeAll */
import { setup, modelize } from 'stubstub';

import { getPubData, getFeedItemForPub } from '../queries';

const models = modelize`
    Community community {
        Pub pub {
            createBranches: false
            createPubCreator: false
            downloads: ${[{ type: 'formatted', url: 'formatted_download.pdf' }]}
            avatar: "avatar.png"
            Release {
                branchKey: 1
            }
            Branch {
                title: "public"
                shortId: 0
                Export ex0 {
                    historyKey: 1
                    format: "pdf"
                    url: "export.pdf"
                }
                Export {
                    historyKey: 1
                    format: "jats"
                    url: "export.xml"
                }
            }
            PubAttribution {
                name: "PA1"
                isAuthor: true
                order: 0
            }
            PubAttribution {
                name: "PA2"
                isAuthor: false
                order: 0.1
            }
            PubAttribution {
                isAuthor: true
                order: 0.2
                User {
                    fullName: "PA3"
                }
            }
            CollectionPub {
                rank: "0"
                pubRank: "b"
                Collection {
                   isPublic: true
                   title: "C1" 
                }
            }
            CollectionPub {
                rank: "1"
                pubRank: "c"
                Collection {
                   isPublic: true
                   title: "C2" 
                }
            }
            CollectionPub {
                rank: "2"
                pubRank: "d"
                Collection {
                   title: "C3" 
                }
            }
            CollectionPub {
                rank: "3"
                pubRank: "a"
                Collection {
                   title: "C4" 
                   isPublic: true
                   CollectionAttribution {
                       name: "CA1"
                       isAuthor: true
                   }
                }
            }
        }
    }
`;

setup(beforeAll, async () => {
	await models.resolve();
});

it('provides all expected attributes', async () => {
	const {
		pub: { id: pubId },
		community,
	} = models;
	const [pub] = await getPubData([pubId]);
	const feedItem = getFeedItemForPub(pub, community);
	const creators = feedItem.custom_elements.map((item) => item['dc:creator']).filter((x) => x);
	const enclosures = feedItem.custom_elements
		.map((item: any) => item.enclosure && item.enclosure._attr.url)
		.filter((x) => x);
	// Primary collection comes first, private collections excluded
	expect(feedItem.categories[0]).toEqual('C4');
	expect(new Set(feedItem.categories.slice(1))).toEqual(new Set(['C1', 'C2']));
	// Authors from Pub and Collection in expected order
	expect(creators).toEqual(['PA1', 'PA3', 'CA1']);
	// Enclosure includes avatar, PDF export, XML export
	expect(enclosures).toEqual(['avatar.png', 'formatted_download.pdf', 'export.xml']);
});
