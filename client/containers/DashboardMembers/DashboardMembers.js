import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { ControlGroup, Button, Intent } from '@blueprintjs/core';

import { SettingsSection, UserAutocomplete } from 'components';
import { apiFetch } from 'utils';
import { usePageContext } from 'utils/hooks';

import MemberRow from './MemberRow';
import InheritedBlock from './InheritedBlock';

require('./dashboardMembers.scss');

const propTypes = {
	membersData: PropTypes.object.isRequired,
};

const membersReducer = (state, action) => {
	const { members } = state;
	if (action.type === 'add-member') {
		const { member, index } = action;
		const nextMembers =
			typeof index === 'number'
				? [...members.slice(0, index), member, ...members.slice(index)]
				: [...members, member];
		return { ...state, members: nextMembers };
	}
	if (action.type === 'remove-member') {
		return {
			...state,
			members: members.filter((member) => member !== action.member),
		};
	}
	return state;
};

const DashboardMembers = (props) => {
	const [membersData, dispatchToMembers] = useReducer(membersReducer, props.membersData);
	const { scopeData } = usePageContext();
	const { activeTargetType } = scopeData.elements;

	const membersByType = {
		pub: membersData.members.filter((mb) => mb.pubId),
		collection: membersData.members.filter((mb) => mb.collectionId),
		community: membersData.members.filter((mb) => mb.communityId),
		organization: membersData.members.filter((mb) => mb.organizationId),
	};

	const localMembers = membersByType[activeTargetType];
	const showLocalEmptyState = !localMembers.length && !membersData.invitations.length;

	const hasInheritedMembers =
		(membersByType.collection.length && activeTargetType !== 'collection') ||
		(membersByType.community.length && activeTargetType !== 'community') ||
		(membersByType.organization.length && activeTargetType !== 'organization');

	const handleAddUser = (user) => {
		apiFetch('/api/members', {
			method: 'POST',
			body: JSON.stringify({
				...scopeData.elements.activeIds,
				targetUserId: user.id,
				value: {
					permissions: 'view',
				},
			}),
		}).then((member) => dispatchToMembers({ type: 'add-member', member: member }));
	};

	const handleRemoveMember = (member) => {
		const memberIndex = membersData.members.indexOf(member);
		dispatchToMembers({ type: 'remove-member', member: member });
		apiFetch('/api/members', {
			method: 'DELETE',
			body: JSON.stringify({
				...scopeData.elements.activeIds,
				id: member.id,
			}),
		}).catch(() =>
			dispatchToMembers({ type: 'add-member', member: member, index: memberIndex }),
		);
	};

	return (
		<div className="dashboard-members-container">
			<h2 className="dashboard-content-header">
				{scopeData.elements.activeTargetName} Members
			</h2>

			<SettingsSection title="Add Member">
				<ControlGroup>
					<UserAutocomplete
						onSelect={handleAddUser}
						usedUserIds={localMembers.map((member) => member.userId)}
					/>
					<Button large text="Add" intent={Intent.PRIMARY} />
				</ControlGroup>
			</SettingsSection>

			<SettingsSection title="Members">
				{showLocalEmptyState && <i>No members yet.</i>}
				{membersData.invitations.map((invitation) => {
					return (
						<MemberRow
							isInvitation={true}
							memberData={invitation}
							key={invitation.id}
						/>
					);
				})}
				{membersByType[activeTargetType].map((member) => {
					return (
						<MemberRow
							memberData={member}
							onDelete={handleRemoveMember}
							key={member.id}
						/>
					);
				})}
			</SettingsSection>

			{!!hasInheritedMembers && (
				<SettingsSection title="Inherited Members">
					{!!membersByType.collection.length && activeTargetType !== 'collection' && (
						<InheritedBlock members={membersByType.collection} scope="Collection" />
					)}
					{!!membersByType.community.length && activeTargetType !== 'community' && (
						<InheritedBlock members={membersByType.community} scope="Community" />
					)}
					{!!membersByType.organization.length && activeTargetType !== 'organization' && (
						<InheritedBlock members={membersByType.organization} scope="Organization" />
					)}
				</SettingsSection>
			)}
		</div>
	);
};

DashboardMembers.propTypes = propTypes;
export default DashboardMembers;
