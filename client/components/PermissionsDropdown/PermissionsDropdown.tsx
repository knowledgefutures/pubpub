import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem } from '@blueprintjs/core';
import { DropdownButton } from 'components';

const propTypes = {
	prefix: PropTypes.node,
	isSmall: PropTypes.bool,
	isMinimal: PropTypes.bool,
	onChange: PropTypes.func,
	isDisabled: PropTypes.bool,
	allowedTypes: PropTypes.array.isRequired,
	value: PropTypes.string.isRequired,
};
const defaultProps = {
	prefix: '',
	isSmall: true,
	isMinimal: false,
	onChange: () => {},
	isDisabled: false,
};

const PermissionsDropdown = function (props) {
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
			// icon: `${Classes.ICON}-eye-open`,
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
			// icon: `${Classes.ICON}-edit2`,
			onClick: () => {
				props.onChange('edit');
			},
		},
		manage: {
			value: 'manage',
			title: 'Manage',
			// icon: `${Classes.ICON}-manage2`,
			onClick: () => {
				props.onChange('manage');
			},
		},
	};

	Object.keys(items).forEach((type) => {
		if (!props.allowedTypes.includes(type)) {
			delete items[type];
		}
	});

	const selectedKey = props.value || items[props.allowedTypes[0]].value;
	const style = {
		marginRight: props.prefix ? '1em' : '0em',
	};
	return (
		<div className="permissions-dropdown-component">
			<DropdownButton
				label={
					<React.Fragment>
						<span style={style} key="prefix">
							{props.prefix}
						</span>
						<span key="title">{items[selectedKey] && items[selectedKey].title}</span>
					</React.Fragment>
				}
				// icon={items[selectedKey].icon}
				isRightAligned={true}
				isDisabled={props.isDisabled}
				isSmall={props.isSmall}
				isMinimal={props.isMinimal}
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
