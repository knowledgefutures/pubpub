import React, { useState } from 'react';
import dateFormat from 'dateformat';
import { Button, Classes, Tag } from '@blueprintjs/core';

import { Avatar } from 'components';
import { MenuButton } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

import { permissionValues } from './permissionValues';
import SelfDestructiveActionDialog from './SelfDestructiveActionDialog';
import MemberPermissionPicker from './MemberPermissionPicker';

require('./memberRow.scss');

type OwnProps = {
	memberData: any;
	isInvitation?: boolean;
	isOnlyMemberInScope?: boolean;
	isReadOnly?: boolean;
	onUpdate?: (...args: any[]) => any;
	onDelete?: (...args: any[]) => any;
};

const defaultProps = {
	isInvitation: false,
	isOnlyMemberInScope: false,
	isReadOnly: false,
	onUpdate: null,
	onDelete: null,
};

type Props = OwnProps & typeof defaultProps;

// const permissionTypes = [
// 	{
// 		key: 'view',
// 		description: {
// 			pub: ['View Pub when unpublished', 'View member-only Discussions and Reviews'],
// 			collection: ['View all unpublished Pubs', 'View member-only Discussions and Reviews'],
// 			community: ['View all unpublished Pubs', 'View member-only Discussions and Reviews'],
// 		},
// 	},
// 	{
// 		key: 'edit',
// 		description: {
// 			pub: ['Edit Pub draft', 'All View permissions'],
// 			collection: ['Edit Pub drafts', 'All View permissions'],
// 			community: ['Edit Pub drafts', 'All View permissions'],
// 		},
// 	},
// 	{
// 		key: 'manage',
// 		description: {
// 			pub: ['Manage Pub settings', 'All Edit permissions'],
// 			collection: [
// 				'Manage Pub settings',
// 				'Manage Collection settings',
// 				'Create new Pubs in this Collection',
// 				'All Edit permissions',
// 			],
// 			community: [
// 				'Manage Pub settings',
// 				'Manage Collection settings',
// 				'Manage Community settings',
// 				'Create new Pubs',
// 				'Create new Collections',
// 				'All Edit permissions',
// 			],
// 		},
// 	},
// 	{
// 		key: 'admin',
// 		description: {
// 			pub: [
// 				'Create Releases',
// 				'See all Discussions and Reviews',
// 				'Delete Pub',
// 				'All Manage permissions',
// 			],
// 			collection: [
// 				'Create Pub Releases',
// 				'See all Discussions and Reviews',
// 				'Delete Pubs',
// 				'Delete Collection',
// 				'All Manage permissions',
// 			],
// 			community: [
// 				'Create Pub Releases',
// 				'See all Discussions and Reviews',
// 				'Assign DOIs',
// 				'Delete Pubs',
// 				'Delete Collections',
// 				'Delete Community',
// 				'All Manage permissions',
// 			],
// 		},
// 	},
// ];

// // Pub
// // - View unpublished Pub
// // - View member-only reviews and Discussions
// // - Edit Pub draft
// // - Manage Pub settings
// // - Create Releases
// // - See all discussions and reviews
// // - delete pub

// // Collection
// // - View unpublished Pubs
// // - View member-only reviews and Discussions
// // - Edit Pub drafts
// // - Manage Pub settings
// // - Manage collection settings
// // - Create new pubs in collection
// // - Create Releases
// // - Delete collections
// // - See all discussions and reviews
// // - delete pubs

const MemberRow = (props: Props) => {
	const { memberData, isInvitation, isReadOnly, isOnlyMemberInScope, onDelete, onUpdate } = props;
	const { scopeData, loginData } = usePageContext();
	const [selfDestructiveAction, setSelfDestructiveAction] = useState(null);
	const { activeTargetType } = scopeData.elements;
	const { canAdmin } = scopeData.activePermissions;

	const isOnlyMemberInCommunity = isOnlyMemberInScope && activeTargetType === 'community';
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'permissions' does not exist on type 'nev... Remove this comment to see the full error message
	const outOfPermissionRange = !canAdmin && memberData.permissions === 'admin';
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'user' does not exist on type 'never'.
	const user = memberData.user || { fullName: memberData.email, initials: '@' };
	const isSelfUser = user.id && loginData.id === user.id;

	const setMemberPermissions = (permissions) =>
		// @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
		onUpdate(memberData, { permissions });

	// @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
	const deleteMember = () => onDelete(memberData);

	const commitSelfDestructiveAction = () => {
		if (selfDestructiveAction) {
			// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
			Promise.resolve(selfDestructiveAction.onConfirm()).then(() => window.location.reload());
		}
	};

	const cancelSelfDestructiveAction = () => setSelfDestructiveAction(null);

	const handlePermissionsChange = (permissions) => {
		const isDemotion =
			permissionValues.indexOf(permissions) <
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'permissions' does not exist on type 'nev... Remove this comment to see the full error message
			permissionValues.indexOf(memberData.permissions);
		if (isSelfUser && isDemotion) {
			setSelfDestructiveAction({
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ dialogType: string; onConfirm:... Remove this comment to see the full error message
				dialogType: 'demote',
				onConfirm: () => setMemberPermissions(permissions),
			});
		} else {
			setMemberPermissions(permissions);
		}
	};

	const handleDeleteClick = () => {
		if (isSelfUser) {
			setSelfDestructiveAction({
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '{ dialogType: string; onConfirm:... Remove this comment to see the full error message
				dialogType: 'delete',
				onConfirm: deleteMember,
			});
		} else {
			deleteMember();
		}
	};

	const renderControls = () => {
		const permissionSelector = onUpdate && (
			<MenuButton
				aria-label="Select member permissions"
				className={`member-permission-select ${Classes.ELEVATION_3}`}
				placement="bottom-end"
				buttonProps={{
					className: 'permission-button',
					rightIcon: 'caret-down',
					outlined: true,
				}}
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'permissions' does not exist on type 'nev... Remove this comment to see the full error message
				buttonContent={`${memberData.permissions}`}
			>
				<MemberPermissionPicker
					activeTargetType={activeTargetType}
					canAdmin={canAdmin}
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'permissions' does not exist on type 'nev... Remove this comment to see the full error message
					activePermission={memberData.permissions}
					onSelect={handlePermissionsChange}
				/>
			</MenuButton>
		);

		const deleteButton = onDelete && !isOnlyMemberInCommunity && (
			<Button
				minimal
				icon="cross"
				onClick={handleDeleteClick}
				disabled={outOfPermissionRange}
			/>
		);

		return (
			<React.Fragment>
				{permissionSelector}
				{deleteButton}
			</React.Fragment>
		);
	};

	return (
		<div className="member-row-component">
			{selfDestructiveAction && (
				<SelfDestructiveActionDialog
					// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
					key={`self-destructive-${selfDestructiveAction.dialogType}`}
					isOpen={true}
					// @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
					dialogType={selfDestructiveAction.dialogType}
					onConfirm={commitSelfDestructiveAction}
					onCancel={cancelSelfDestructiveAction}
				/>
			)}
			<Avatar
				className={isInvitation ? 'invitation' : ''}
				initials={user.initials}
				avatar={user.avatar}
				width={30}
			/>
			<div className="member-info">
				<div className="member-name">{user.fullName}</div>
				{isInvitation && (
					<Tag className="pending-tag" minimal>
						Pending
					</Tag>
				)}
				<div className="added">
					{isInvitation ? 'Invited' : 'Added'}{' '}
					{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'createdAt' does not exist on type 'never... Remove this comment to see the full error message */}
					{dateFormat(memberData.createdAt, 'mmm dd, yyyy')}
				</div>
			</div>
			{!(isReadOnly || outOfPermissionRange) && renderControls()}
			{(isReadOnly || outOfPermissionRange) && (
				<Tag minimal large>
					{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'permissions' does not exist on type 'nev... Remove this comment to see the full error message */}
					Can {memberData.permissions}
				</Tag>
			)}
		</div>
	);
};
MemberRow.defaultProps = defaultProps;
export default MemberRow;
