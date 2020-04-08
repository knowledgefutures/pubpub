import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Classes, ControlGroup, Dialog } from '@blueprintjs/core';

import {
	UserAutocomplete,
	MemberRow,
	InheritedMembersBlock,
	MenuConfigProvider,
	PendingChangesProvider,
} from 'components';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { useMembersState } from 'utils/members/useMembers';

require('./membersDialog.scss');

const propTypes = {};
const defaultProps = {};

const getHelperText = (activeTargetName, activeTargetType, canModifyMembers) => {
	if (canModifyMembers) {
		const containingPubsString =
			activeTargetType === 'pub' ? '' : " They'll have access to all the Pubs it contains.";
		return `To let others collaborate on this ${activeTargetName}, add them as Members.${containingPubsString}`;
	}
	const containingPubsString =
		activeTargetType === 'pub' ? '.' : ' as well as all the Pubs it contains.';

	return `Members can collaborate on this ${activeTargetName}${containingPubsString}`;
};

const MembersDialogInner = (props) => {
	const { members, scopeData } = props;
	const { canManage } = scopeData.activePermissions;
	const { activeTargetName, activeTargetType } = scopeData.elements;
	const { pendingCount } = usePendingChanges();
	const { membersByType, addMember, updateMember, removeMember } = useMembersState({
		initialMembers: members,
	});

	const localMembers = membersByType[activeTargetType];

	return (
		<>
			<p>{getHelperText(activeTargetName, activeTargetType, canManage)}</p>
			{canManage && (
				<ControlGroup className="add-member-controls">
					<UserAutocomplete
						onSelect={addMember}
						usedUserIds={localMembers.map((member) => member.userId)}
					/>
					<Button large text="Add" intent="primary" loading={pendingCount > 0} />
				</ControlGroup>
			)}
			<div className="members-container">
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
			</div>
			{!!membersByType.collection.length && activeTargetType !== 'collection' && (
				<InheritedMembersBlock members={membersByType.collection} scope="Collection" />
			)}
			{!!membersByType.community.length && activeTargetType !== 'community' && (
				<InheritedMembersBlock members={membersByType.community} scope="Community" />
			)}
			{!!membersByType.organization.length && activeTargetType !== 'organization' && (
				<InheritedMembersBlock members={membersByType.organization} scope="Organization" />
			)}
		</>
	);
};

const MembersDialog = (props) => {
	const { isOpen, onClose, members } = props;
	const { scopeData } = usePageContext();

	const {
		elements: { activeTargetName },
	} = scopeData;

	return (
		<Dialog
			title={`${activeTargetName} Members`}
			className="members-dialog-component"
			isOpen={isOpen}
			onClose={onClose}
		>
			<MenuConfigProvider config={{ usePortal: false }}>
				<PendingChangesProvider>
					<div className={Classes.DIALOG_BODY}>
						<MembersDialogInner scopeData={scopeData} members={members} />
					</div>
				</PendingChangesProvider>
			</MenuConfigProvider>
		</Dialog>
	);
};

MembersDialog.propTypes = propTypes;
MembersDialog.defaultProps = defaultProps;
export default MembersDialog;
