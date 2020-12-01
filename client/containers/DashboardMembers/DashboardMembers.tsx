import React from 'react';
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

type Props = {
	membersData: any;
};

const DashboardMembers = (props: Props) => {
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
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(user: any) => any' is not assignable to typ... Remove this comment to see the full error message
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
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
							isInvitation={true}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							memberData={invitation}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							key={invitation.id}
						/>
					);
				})}
				{membersByType[activeTargetType].map((member) => {
					return (
						<MemberRow
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
							memberData={member}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
							isReadOnly={!canManage}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
							isOnlyMemberInScope={membersByType[activeTargetType].length === 1}
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(member: any, update: any) => any' is not as... Remove this comment to see the full error message
							onUpdate={updateMember}
							// @ts-expect-error ts-migrate(2322) FIXME: Type '(member: any) => Promise<any>' is not assign... Remove this comment to see the full error message
							onDelete={removeMember}
							// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
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
export default DashboardMembers;
