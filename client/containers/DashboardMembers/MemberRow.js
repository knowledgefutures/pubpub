import React from 'react';
import PropTypes from 'prop-types';
import dateFormat from 'dateformat';
import { Select } from '@blueprintjs/select';
import { Position, MenuItem, Button, Tag } from '@blueprintjs/core';
import { Avatar } from 'components';

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

const MemberRow = (props) => {
	const { memberData, isInvitation, isReadOnly, onDelete, onUpdate } = props;
	const user = memberData.user || { fullName: memberData.email, initials: '@' };

	const renderControls = () => {
		const permissionSelector = onUpdate && (
			<Select
				className="permission-select"
				activeItem={memberData.permissions}
				items={['view', 'edit', 'manage', 'admin']}
				filterable={false}
				popoverProps={{ minimal: true, position: Position.BOTTOM_RIGHT }}
				onItemSelect={(item) => {
					console.log('selected', item);
				}}
				itemRenderer={(item, rendererProps) => {
					return (
						<MenuItem
							key={item}
							text={<span className="capitalize">{item}</span>}
							active={rendererProps.modifiers.active}
							onClick={rendererProps.handleClick}
						/>
					);
				}}
			>
				<Button
					text={<span className="capitalize">{memberData.permissions}</span>}
					rightIcon="caret-down"
				/>
			</Select>
		);

		const deleteButton = onDelete && (
			<Button minimal icon="cross" onClick={() => onDelete(memberData)} />
		);

		return (
			<>
				{permissionSelector}
				{deleteButton}
			</>
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
			{!isReadOnly && renderControls()}
			{isReadOnly && (
				<Tag minimal large className="capitalize">
					{memberData.permissions}
				</Tag>
			)}
		</div>
	);
};

MemberRow.propTypes = propTypes;
MemberRow.defaultProps = defaultProps;
export default MemberRow;
