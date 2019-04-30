import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@blueprintjs/core';
import { DropdownButton } from 'components';

const propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func,
	isDisabled: PropTypes.bool,
	allowedTyped: PropTypes.array.isRequired,
};
const defaultProps = {
	value: 'none',
	onChange: () => {},
	isDisabled: false,
};

const PermissionsDropdown = function(props) {
	const items = {
		none: {
			value: 'none',
			title: 'None',
			onClick: () => {
				props.onChange('none');
			},
		},
		view: {
			value: 'view',
			title: 'View',
			// icon: 'bp3-icon-eye-open',
			onClick: () => {
				props.onChange('view');
			},
		},
		discuss: {
			value: 'discuss',
			title: 'Discuss',
			onClick: () => {
				props.onChange('discuss');
			},
		},
		edit: {
			value: 'edit',
			title: 'Edit',
			// icon: 'bp3-icon-edit2',
			onClick: () => {
				props.onChange('edit');
			},
		},
		manage: {
			value: 'manage',
			title: 'Manage',
			// icon: 'bp3-icon-manage2',
			onClick: () => {
				props.onChange('manage');
			},
		},
	};

	Object.keys(items).forEach((type) => {
		if (!props.allowedTyped.includes(type)) {
			delete items[type];
		}
	});

	const selectedKey = props.value || items[props.allowedTyped[0]].value;
	return (
		<div className="permissions-dropdwon-component">
			<DropdownButton
				label={items[selectedKey].title}
				// icon={items[selectedKey].icon}
				isRightAligned={true}
				isDisabled={props.isDisabled}
				isSmall={true}
			>
				<Menu>
					{Object.keys(items).map((key) => {
						const item = items[key];
						return (
							<MenuItem
								key={`${item.value}-option`}
								text={item.title}
								onClick={item.onClick}
							/>
						);
					})}
				</Menu>
			</DropdownButton>
		</div>
	);
};

PermissionsDropdown.propTypes = propTypes;
PermissionsDropdown.defaultProps = defaultProps;
export default PermissionsDropdown;
