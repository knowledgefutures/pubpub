import React from 'react';
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
import { useMembersState } from 'client/utils/members/useMembers';

require('./dashboardMembers.scss');

const propTypes = {
	membersData: PropTypes.object.isRequired,
};

const DashboardMembers = (props) => {
	const { membersData } = props;
	const { membersByType, addMember, updateMember, removeMember } = useMembersState({
		initialMembers: membersData.members,
	});
	const { scopeData } = usePageContext();
	const {
		elements: { activeTargetType, activeTargetName },
		activePermissions: { canManage },
	} = scopeData;

	const localMembers = membersByType[activeTargetType];
	const showLocalEmptyState = !localMembers.length && !membersData.invitations.length;

	const hasInheritedMembers =
		(membersByType.collection.length && activeTargetType !== 'collection') ||
		(membersByType.community.length && activeTargetType !== 'community') ||
		(membersByType.organization.length && activeTargetType !== 'organization');

	return (
		<DashboardFrame
			className="dashboard-members-container"
			title="Members"
			details={`Invite and manage collaborators on this ${activeTargetName}.`}
		>
			{canManage && (
				<SettingsSection title="Add Member">
					<ControlGroup className="add-member-controls">
						<UserAutocomplete
							onSelect={addMember}
							usedUserIds={localMembers.map((member) => member.userId)}
						/>
						<Button large text="Add" intent={Intent.PRIMARY} />
					</ControlGroup>
				</SettingsSection>
			)}

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
							isOnlyMemberInScope={membersByType[activeTargetType].length === 1}
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
