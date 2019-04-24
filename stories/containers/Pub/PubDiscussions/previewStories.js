import React from 'react';
import { storiesOf } from '@storybook/react';
import { ButtonGroup } from '@blueprintjs/core';
import Preview from 'containers/Pub/PubDocument/PubDiscussions/SidePreviews/Preview';

require('containers/Pub/PubDocument/PubDiscussions/SidePreviews/sidePreviews.scss');

const props = {
	threadData: [
		{
			id: '5bbb77b1-72d0-4f94-a9f3-2d053419c8b1',
			title: 'New Discussion on Apr 24',
			threadNumber: 12,
			text: 'Top line! Well well?!',
			content: {
				type: 'doc',
				attrs: {
					meta: {},
				},
				content: [
					{
						type: 'paragraph',
						attrs: {
							class: null,
						},
						content: [
							{
								text: 'Top line! Well well?!',
								type: 'text',
							},
						],
					},
				],
			},
			attachments: null,
			suggestions: null,
			highlights: null,
			submitHash: null,
			submitApprovedAt: null,
			isArchived: null,
			labels: null,
			userId: '52580dd1-0588-4ffc-b3a8-0b64acb856e1',
			pubId: '52d426d9-3e69-4f89-8d45-933a9914c867',
			communityId: 'eea8ec7d-6ba0-4c31-98bd-1da69b5d2141',
			discussionChannelId: null,
			branchId: 'ea780b4c-92b1-4a8a-91d1-c0dfba52a399',
			createdAt: '2019-04-24T13:48:46.023Z',
			updatedAt: '2019-04-24T14:26:48.001Z',
			author: {
				id: '52580dd1-0588-4ffc-b3a8-0b64acb856e1',
				fullName: 'Tomer Weller',
				avatar: 'https://s3.amazonaws.com/pubpub-upload/users/1451683142125.jpg',
				slug: 'tomer-weller',
				initials: 'TW',
				title: null,
			},
		},
		{
			id: '4208c132-eca4-4c37-99d2-88e373c9c6bf',
			title: '',
			threadNumber: 12,
			text: 'And a reply on the top line!? A long reply at that. This is fascinating.',
			content: {
				type: 'doc',
				attrs: {
					meta: {},
				},
				content: [
					{
						type: 'paragraph',
						attrs: {
							class: null,
						},
						content: [
							{
								text: 'And a reply on the top line!?',
								type: 'text',
							},
						],
					},
				],
			},
			attachments: null,
			suggestions: null,
			highlights: null,
			submitHash: null,
			submitApprovedAt: null,
			isArchived: null,
			labels: null,
			userId: '68870dc5-c650-4e92-86fa-2607b62d73a0',
			pubId: '52d426d9-3e69-4f89-8d45-933a9914c867',
			communityId: 'eea8ec7d-6ba0-4c31-98bd-1da69b5d2141',
			discussionChannelId: null,
			branchId: 'ea780b4c-92b1-4a8a-91d1-c0dfba52a399',
			createdAt: '2019-04-24T13:48:52.995Z',
			updatedAt: '2019-04-24T14:27:01.914Z',
			author: {
				id: '68870dc5-c650-4e92-86fa-2607b62d73a0',
				fullName: 'René Argüellez',
				avatar: 'https://s3.amazonaws.com/pubpub-upload/users/1452209667772.jpg',
				slug: 'ren-argellez',
				initials: 'RA',
				title: null,
			},
		},
		{
			id: 'b9b5ac01-cc2c-4819-a832-397ca142a1a3',
			title: '',
			threadNumber: 12,
			text: 'Now with proper rerender?',
			content: {
				type: 'doc',
				attrs: {
					meta: {},
				},
				content: [
					{
						type: 'paragraph',
						attrs: {
							class: null,
						},
						content: [
							{
								text: 'Now with proper rerender?',
								type: 'text',
							},
						],
					},
				],
			},
			userId: 'c850b929-247a-48ef-8651-503490a0774d',
			pubId: '52d426d9-3e69-4f89-8d45-933a9914c867',
			communityId: 'eea8ec7d-6ba0-4c31-98bd-1da69b5d2141',
			branchId: 'ea780b4c-92b1-4a8a-91d1-c0dfba52a399',
			createdAt: '2019-04-24T13:50:20.574Z',
			updatedAt: '2019-04-24T13:50:20.574Z',
			author: {
				id: 'c850b929-247a-48ef-8651-503490a0774d',
				fullName: 'Mónica Tapia',
				avatar: 'https://s3.amazonaws.com/pubpub-upload/users/1452551620299.jpg',
				slug: 'mnica-tapia',
				initials: 'MT',
				title: null,
			},
		},
		{
			id: '210d2022-2372-4576-955a-c1c4d97c61e9',
			title: '',
			threadNumber: 12,
			text: 'Even from here?',
			content: {
				type: 'doc',
				attrs: {
					meta: {},
				},
				content: [
					{
						type: 'paragraph',
						attrs: {
							class: null,
						},
						content: [
							{
								text: 'Even from here?',
								type: 'text',
							},
						],
					},
				],
			},
			attachments: null,
			suggestions: null,
			highlights: null,
			submitHash: null,
			submitApprovedAt: null,
			isArchived: null,
			labels: null,
			userId: '52580dd1-0588-4ffc-b3a8-0b64acb856e1',
			pubId: '52d426d9-3e69-4f89-8d45-933a9914c867',
			communityId: 'eea8ec7d-6ba0-4c31-98bd-1da69b5d2141',
			discussionChannelId: null,
			branchId: 'ea780b4c-92b1-4a8a-91d1-c0dfba52a399',
			createdAt: '2019-04-24T13:50:34.826Z',
			updatedAt: '2019-04-24T13:50:34.826Z',
			author: {
				id: '52580dd1-0588-4ffc-b3a8-0b64acb856e1',
				fullName: 'Tomer Weller',
				avatar: 'https://s3.amazonaws.com/pubpub-upload/users/1451683142125.jpg',
				slug: 'tomer-weller',
				initials: 'TW',
				title: null,
			},
		},
	],
	isCollapsed: true,
	discussionsState: {},
};
storiesOf('containers/Pub/PubDiscussions/Preview', module).add('default', () => (
	<div style={{ margin: '1em', position: 'static' }} className="pub-discussions_side-previews">
		<h3>Single, collaped</h3>
		<Preview {...props} />
		<h3 style={{ marginTop: '2em' }}>Single, uncollapsed</h3>
		<Preview {...{ ...props, isCollapsed: false }} />
		<h3 style={{ marginTop: '2em' }}>Multiple</h3>
		<ButtonGroup vertical={true} className="preview-button-group">
			<Preview {...{ ...props, isCollapsed: false }} />
			<Preview {...{ ...props, threadData: [props.threadData[0]], isCollapsed: false }} />
		</ButtonGroup>
	</div>
));
