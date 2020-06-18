import React from 'react';
import { storiesOf } from '@storybook/react';

import DashboardMembers from 'containers/DashboardMembers/DashboardMembers';
import { locationData, loginData, communityData } from 'utils/storybook/data';

const membersData = {
	members: [
		{
			id: 'd6228d98-0cd9-4711-877b-bc5c3c7d6d4b',
			permissions: 'manage',
			isOwner: false,
			userId: 'd6028d98-0cd9-4711-877b-bc5c3c7d6d4b',
			collectionId: '65fc8561-31ea-4e2c-8067-b315dd7c933f',
			createdAt: '2019-04-20T18:12:05.538Z',
			updatedAt: '2019-04-30T15:23:17.211Z',
			user: {
				id: 'd6028d98-0cd9-4711-877b-bc5c3c7d6d4b',
				firstName: 'Travis',
				lastName: 'Cohen',
				fullName: 'Travis Cohen',
				avatar: null,
				slug: 'traviscohen',
				initials: 'TC',
				title: 'Professor',
			},
			collection: {
				id: '65fc8561-31ea-4e2c-8067-b315dd7c933f',
				title: 'Issue 1',
				isRestricted: true,
				isPublic: true,
				pageId: 'f7c79073-8110-40c2-9d4f-9d090673cec0',
				communityId: '7808da6b-94d1-436d-ad79-2e036a8e4428',
				metadata: null,
				kind: 'tag',
				doi: null,
				createdAt: '2019-01-22T03:16:13.644Z',
				updatedAt: '2019-01-22T03:17:58.495Z',
			},
		},
		{
			id: 'd6228d98-0cd9-4711-877b-bc5c3c7d6d4b',
			permissions: 'edit',
			isOwner: false,
			userId: 'd6028d98-0cd9-4711-877b-bc5c3c7d6d4b',
			collectionId: '65fc8561-31ea-4e2c-8067-b315dd7c933f',
			createdAt: '2019-04-14T18:12:05.538Z',
			updatedAt: '2019-04-30T15:23:17.211Z',
			user: {
				id: 'd6028d98-0cd9-4711-877b-bc5c3c7d6d4b',
				firstName: 'Megan',
				lastName: 'Lilre',
				fullName: 'Megan Lilre',
				avatar: null,
				slug: 'meg',
				initials: 'ML',
			},
			collection: {
				id: '65f33561-31ea-4e2c-8067-b315ddcc933f',
				title: 'Physics',
				isRestricted: true,
				isPublic: true,
				pageId: 'f7c79073-8110-40c2-9d4f-9d090673cec0',
				communityId: '7808da6b-94d1-436d-ad79-2e036a8e4428',
				metadata: null,
				kind: 'tag',
				doi: null,
				createdAt: '2019-01-22T03:16:13.644Z',
				updatedAt: '2019-01-22T03:17:58.495Z',
			},
		},
		{
			id: 'd6228d98-0cd9-4711-877b-bc5c3c7d6d4b',
			permissions: 'edit',
			isOwner: false,
			userId: 'd6028d98-0cd9-4711-877b-bc5c3c7d6d4b',
			communityId: '65fc8561-22ea-4e2c-8067-b315dd7c933f',
			createdAt: '2019-07-05T18:12:05.538Z',
			updatedAt: '2019-07-30T15:23:17.211Z',
			user: {
				id: 'd6000d98-0cd9-4711-877b-bc5c3c7d6d4b',
				firstName: 'Perry',
				lastName: 'Uwombukelo',
				fullName: 'Perry Uwombukelo',
				avatar: null,
				slug: 'pw',
				initials: 'PU',
			},
		},
		{
			id: 'da228d98-0cd9-4711-877b-bc5c3c7d6d4b',
			permissions: 'view',
			isOwner: false,
			userId: 'd6028d98-0cd9-4711-877b-bc5c3c7d6d4b',
			pubId: '11fc8561-31ea-4e2c-8067-b315dd7c933f',
			createdAt: '2019-05-08T18:12:05.538Z',
			updatedAt: '2019-05-30T15:23:17.211Z',
			user: {
				id: 'd6028d98-0cd9-4711-877b-bc5c3c7d6d4b',
				firstName: 'Marty',
				lastName: 'Wolehu',
				fullName: 'Marty Wolehu',
				avatar: null,
				slug: 'marty',
				initials: 'MW',
			},
		},
	],
	invitations: [
		{
			id: 'd3328d98-0cd9-4711-877b-bc5c3c7d6d4b',
			permissions: 'view',
			email: 'borna@gmail.com',
			pubId: '11fc8561-31ea-4e2c-8067-b315dd7c933f',
			createdAt: '2019-06-12T18:12:05.538Z',
			updatedAt: '2019-06-30T15:23:17.211Z',
		},
	],
};

storiesOf('Containers/DashboardMembers', module).add('default', () => (
	<DashboardMembers
		locationData={locationData}
		loginData={loginData}
		communityData={communityData}
		membersData={membersData}
	/>
));
