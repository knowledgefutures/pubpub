import React from 'react';

import {
	MemberCreatedActivityItem,
	MemberUpdatedActivityItem,
	MemberRemovedActivityItem,
} from 'types';

import { memberTitle, scopeTitle } from '../titles';
import { itemRenderer } from './itemRenderer';

type Titles = 'member' | 'scope';

export const renderMemberCreated = itemRenderer<MemberCreatedActivityItem, Titles>({
	icon: 'people',
	titleRenderers: {
		member: memberTitle,
		scope: scopeTitle,
	},
	message: ({ item, titles }) => {
		const { actor, member, scope } = titles;
		const { permissions } = item.payload;
		return (
			<>
				{actor} added {member} as a member of {scope} with <i>{permissions}</i> permissions
			</>
		);
	},
});

export const renderMemberUpdated = itemRenderer<MemberUpdatedActivityItem, Titles>({
	icon: 'people',
	titleRenderers: {
		member: memberTitle,
		scope: scopeTitle,
	},
	message: ({ item, titles }) => {
		const { actor, member, scope } = titles;
		const { permissions } = item.payload;
		if (permissions) {
			return (
				<>
					{actor} changed the membership permissions of {member} in {scope} from{' '}
					<i>{permissions.from}</i> to <i>{permissions.to}</i>
				</>
			);
		}
		return (
			<>
				{actor} changed the membership permissions of {member} in {scope}
			</>
		);
	},
});

export const renderMemberRemoved = itemRenderer<MemberRemovedActivityItem, Titles>({
	icon: 'people',
	titleRenderers: {
		member: memberTitle,
		scope: scopeTitle,
	},
	message: ({ titles }) => {
		const { actor, member, scope } = titles;
		return (
			<>
				{actor} removed {member} as a member from {scope}
			</>
		);
	},
});
