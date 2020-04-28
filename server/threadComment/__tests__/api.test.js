/* global it, expect, beforeAll, afterAll  */
import { setup, teardown, login, modelize } from 'stubstub';

const models = modelize`
    Community community {
        Member {
            permissions: "view"
            User communityViewer {}
        }
        Member {
            permissions: "view"
            User chattyUser {}
        }
        Pub pub {
            Release {}
            DiscussionNew {
                number: 1
                author: chattyUser
                Visibility {
                    access: "public"
                }
                Thread publicThread {}
            }
            DiscussionNew {
                number: 2
                author: chattyUser
                Visibility {
                    access: "members"
                }
                Thread membersThread {}
            }
        }
    }
    User guest {}
    Community otherCommunity {
        Member {
            permissions: "admin"
            User otherCommunityAdmin {}
        }
    }
`;

setup(beforeAll, async () => {
	await models.resolve();
});

teardown(afterAll);

const createThreadComment = ({
	threadId = null,
	threadCommentId = null,
	discussionId = null,
	text = 'Some text',
}) => {
	const { community, pub } = models;
	return {
		threadId: threadId,
		threadCommentId: threadCommentId,
		discussionId: discussionId,
		text: text,
		pubId: pub.id,
		community: community.id,
		content: {},
	};
};

it('allows any user to add to a Discussion with visibility=public', async () => {
	const { guest } = models;
	const agent = await login(guest);
	const {
		body: { id: threadCommentId },
	} = await agent.post('/api/threadComments');
});
