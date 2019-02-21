import React from 'react';
import PropTypes from 'prop-types';
import DropdownButton from 'components/DropdownButton/DropdownButton';

const propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func,
	isDisabled: PropTypes.bool,
	hideNone: PropTypes.bool,
};
const defaultProps = {
	value: 'none',
	onChange: () => {},
	isDisabled: false,
	hideNone: false,
};

const PubOptionsSharingDropdownPermissions = function(props) {
	const keySuffix = Math.round(Math.random() * 25000);
	const items = {
		none: {
			value: 'none',
			title: 'None',
			// icon: 'bp3-icon-lock2',
			onClick: () => {
				props.onChange('none');
			},
			description: 'Cannot view the working draft or discussions.',
		},
		view: {
			value: 'view',
			title: 'View',
			// icon: 'bp3-icon-eye-open',
			onClick: () => {
				props.onChange('view');
			},
			description: 'Can participate in discussions and view updates to the working draft.',
		},
		edit: {
			value: 'edit',
			title: 'Edit',
			// icon: 'bp3-icon-edit2',
			onClick: () => {
				props.onChange('edit');
			},
			description: 'Can directly edit the working draft and participate in discussions.',
		},
	};

	if (props.hideNone) {
		delete items.none;
	}
	const selectedKey = props.value === 'none' && props.hideNone ? 'view' : props.value;
	return (
		<div className="pub-options-sharing-dropdown-permissions-component">
			<DropdownButton
				label={items[selectedKey].title}
				// icon={items[selectedKey].icon}
				isRightAligned={true}
				isDisabled={props.isDisabled}
				isSmall={true}
			>
				<ul className="pub-options-sharing-dropdown-permissions-component pub-options-dropdown bp3-menu">
					{Object.keys(items).map((key) => {
						const item = items[key];
						return (
							<li key={`${item.value}-option-${keySuffix}`}>
								<button
									className={`bp3-menu-item bp3-popover-dismiss ${item.icon}`}
									onClick={item.onClick}
									type="button"
								>
									<div className="title">{item.title}</div>
								</button>
							</li>
						);
					})}
				</ul>
			</DropdownButton>
		</div>
	);
};

PubOptionsSharingDropdownPermissions.propTypes = propTypes;
PubOptionsSharingDropdownPermissions.defaultProps = defaultProps;
export default PubOptionsSharingDropdownPermissions;
