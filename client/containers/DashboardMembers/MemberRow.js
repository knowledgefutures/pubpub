import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Button, Tag } from '@blueprintjs/core';

import { Avatar } from 'components';
import { MenuButton, MenuItem } from 'components/Menu';
import { usePageContext } from 'utils/hooks';

require('./memberRow.scss');

const propTypes = {
	memberData: PropTypes.object.isRequired,
	isInvitation: PropTypes.bool,
	isReadOnly: PropTypes.bool,
	onUpdate: PropTypes.func,
	onDelete: PropTypes.func,
};

const defaultProps = {
	isInvitation: false,
	isReadOnly: false,
	onUpdate: null,
	onDelete: null,
};

const permissionValues = ['view', 'edit', 'manage', 'admin'];

const MemberRow = (props) => {
	const { memberData, isInvitation, isReadOnly, onDelete, onUpdate } = props;
	const user = memberData.user || { fullName: memberData.email, initials: '@' };
	const { scopeData } = usePageContext();
	const { canAdmin } = scopeData.activePermissions;
	const outOfPermissionRange = !canAdmin && memberData.permissions === 'admin';
	const handleSetPermissions = (permissions) =>
		onUpdate(memberData, { permissions: permissions });

	const renderControls = () => {
		const permissionSelector = onUpdate && (
			<MenuButton
				aria-label="Select member permissions"
				className="permission-select"
				buttonProps={{ rightIcon: 'caret-down', minimal: true }}
				buttonContent={`Can ${memberData.permissions}`}
			>
				{permissionValues.map((value) => (
					<MenuItem
						key={value}
						text={<span className="capitalize">{value}</span>}
						active={memberData.permissions === value}
						onClick={() => handleSetPermissions(value)}
						disabled={!canAdmin && value === 'admin'}
					/>
				))}
			</MenuButton>
		);

		const deleteButton = onDelete && (
			<Button
				minimal
				icon="cross"
				onClick={() => onDelete(memberData)}
				disable={outOfPermissionRange}
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
			<Avatar
				className={isInvitation ? 'invitation' : ''}
				initials={user.initials}
				avatar={user.avatar}
				width={30}
			/>
			<div className="member-name">{user.fullName}</div>
			{isInvitation && (
				<Tag className="pending-tag" minimal>
					Pending
				</Tag>
			)}
			<div className="added">
				{isInvitation ? 'Invited' : 'Added'}{' '}
				{dateFormat(memberData.createdAt, 'mmm dd, yyyy')}
			</div>
			{!(isReadOnly || outOfPermissionRange) && renderControls()}
			{(isReadOnly || outOfPermissionRange) && (
				<Tag minimal large>
					Can {memberData.permissions}
				</Tag>
			)}
		</div>
	);
};

MemberRow.propTypes = propTypes;
MemberRow.defaultProps = defaultProps;
export default MemberRow;
