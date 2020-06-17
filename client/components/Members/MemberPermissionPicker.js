import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { Icon } from 'components';
import { usePageContext } from 'utils/hooks';

import { permissionValues } from './permissionValues';

require('./memberPermissionPicker.scss');

const propTypes = {
	activeTargetType: PropTypes.string.isRequired,
	canAdmin: PropTypes.bool.isRequired,
	activePermission: PropTypes.string.isRequired,
	onSelect: PropTypes.func,
};

const defaultProps = {
	onSelect: (permissions) => {
		/* eslint-disable-next-line no-console */
		console.log(permissions);
	},
};

const privileges = {
	pub: [
		{ title: 'View Pub when unpublished', activeAt: 'view' },
		{ title: 'View member-only Discussions and Reviews', activeAt: 'view' },
		{ title: 'Edit Pub draft', activeAt: 'edit' },
		{ title: 'Create Reviews', activeAt: 'edit' },
		{ title: 'Manage Pub settings', activeAt: 'manage' },
		{ title: 'Create Releases', activeAt: 'admin' },
		{ title: 'See all Discussions and Reviews', activeAt: 'admin' },
		{ title: 'Delete Pub', activeAt: 'admin' },
	],
	collection: [
		{ title: 'View all unpublished Pubs', activeAt: 'view' },
		{ title: 'View member-only Discussions and Reviews', activeAt: 'view' },
		{ title: 'Edit Pub drafts', activeAt: 'edit' },
		{ title: 'Create Reviews', activeAt: 'edit' },
		{ title: 'Manage Pub settings', activeAt: 'manage' },
		{ title: 'Manage Collection settings', activeAt: 'manage' },
		{ title: 'Create new Pubs in this Collection', activeAt: 'manage' },
		{ title: 'Create Pub Releases', activeAt: 'admin' },
		{ title: 'See all Discussions and Reviews', activeAt: 'admin' },
		{ title: 'Delete Pubs', activeAt: 'admin' },
		{ title: 'Delete Collection', activeAt: 'admin' },
	],
	community: [
		{ title: 'View all unpublished Pubs', activeAt: 'view' },
		{ title: 'View member-only Discussions and Reviews', activeAt: 'view' },
		{ title: 'Edit Pub drafts', activeAt: 'edit' },
		{ title: 'Create Reviews', activeAt: 'edit' },
		{ title: 'Manage Pub settings', activeAt: 'manage' },
		{ title: 'Manage Collection settings', activeAt: 'manage' },
		{ title: 'Manage Community settings', activeAt: 'manage' },
		{ title: 'Create new Pubs', activeAt: 'manage' },
		{ title: 'Create new Collections', activeAt: 'manage' },
		{ title: 'Create Pub Releases', activeAt: 'admin' },
		{ title: 'See all Discussions and Reviews', activeAt: 'admin' },
		{ title: 'Assign DOIs', activeAt: 'admin' },
		{ title: 'Delete Pubs', activeAt: 'admin' },
		{ title: 'Delete Collections', activeAt: 'admin' },
		{ title: 'Delete Community', activeAt: 'admin' },
	],
};

const MemberPermissionPicker = (props) => {
	const { activeTargetType, activePermission, onSelect, canAdmin } = props;
	const { communityData } = usePageContext();
	const activePrivileges = privileges[activeTargetType];
	return (
		<div className="member-permission-picker-component">
			<style>{`.active .header-row .bp3-icon { background: ${communityData.accentColorDark}}`}</style>
			<div className="picker-column">
				<div className="header-row" />
				{activePrivileges.map((item) => {
					return (
						<div className="row title-row" key={item.title}>
							{item.title}
						</div>
					);
				})}
			</div>
			{permissionValues.map((value, index) => {
				const isActive = value === activePermission;
				const isDisabled = value === 'admin' && !canAdmin;
				return (
					<button
						className={classNames(
							'picker-column',
							isActive && 'active',
							isDisabled && 'disabled',
						)}
						key={value}
						disabled={isDisabled}
						type="button"
						onClick={() => onSelect(value)}
					>
						<div className="header-row">
							<div>{value}</div>
							{isActive && <Icon icon="small-tick" color="#fff" />}
						</div>
						{activePrivileges.map((item) => {
							const isEnabled = permissionValues.indexOf(item.activeAt) < index + 1;
							return <div className="row">{isEnabled ? '•' : ''}</div>;
						})}
					</button>
				);
			})}
		</div>
	);
};

MemberPermissionPicker.propTypes = propTypes;
MemberPermissionPicker.defaultProps = defaultProps;
export default MemberPermissionPicker;
