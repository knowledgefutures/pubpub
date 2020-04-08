import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { ControlGroup, Button, Intent } from '@blueprintjs/core';

import {
	DashboardFrame,
	SettingsSection,
	UserAutocomplete,
	MemberRow,
	InheritedMembersBlock,
} from 'components';
import { usePageContext } from 'utils/hooks';
import { useMembersState } from 'utils/members/useMembers';

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
	if (action.type === 'update-member') {
		return {
			...state,
			members: members.map((currentMember) => {
				if (currentMember.id === action.member.id) {
					return action.member;
				}
				return currentMember;
			}),
		};
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
	const { membersData } = props;
	const { members, addMember, updateMember, removeMember } = useMembersState(membersData.members);
	const { scopeData } = usePageContext();
	const {
		elements: { activeTargetType },
		activePermissions: { canManage },
	} = scopeData;

	const membersByType = {
		pub: members.filter((mb) => mb.pubId),
		collection: members.filter((mb) => mb.collectionId),
		community: members.filter((mb) => mb.communityId),
		organization: members.filter((mb) => mb.organizationId),
	};

	const localMembers = membersByType[activeTargetType];
	const showLocalEmptyState = !localMembers.length && !membersData.invitations.length;

	const hasInheritedMembers =
		(membersByType.collection.length && activeTargetType !== 'collection') ||
		(membersByType.community.length && activeTargetType !== 'community') ||
		(membersByType.organization.length && activeTargetType !== 'organization');

	return (
		<DashboardFrame className="dashboard-members-container" title="Members">
			<SettingsSection title="Add Member">
				<ControlGroup className="add-member-controls">
					<UserAutocomplete
						onSelect={addMember}
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
							isReadOnly={!canManage}
							onUpdate={updateMember}
							onDelete={removeMember}
							key={member.id}
						/>
					);
				})}
			</SettingsSection>

			{!!hasInheritedMembers && (
				<SettingsSection title="Inherited Members">
					{!!membersByType.collection.length && activeTargetType !== 'collection' && (
						<InheritedMembersBlock
							members={membersByType.collection}
							scope="Collection"
						/>
					)}
					{!!membersByType.community.length && activeTargetType !== 'community' && (
						<InheritedMembersBlock
							members={membersByType.community}
							scope="Community"
						/>
					)}
					{!!membersByType.organization.length && activeTargetType !== 'organization' && (
						<InheritedMembersBlock
							members={membersByType.organization}
							scope="Organization"
						/>
					)}
				</SettingsSection>
			)}
		</DashboardFrame>
	);
};

DashboardMembers.propTypes = propTypes;
export default DashboardMembers;
