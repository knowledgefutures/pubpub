import React from 'react';
import PropTypes from 'prop-types';
import DropdownButton from 'components/DropdownButton/DropdownButton';
import Icon from 'components/Icon/Icon';

const propTypes = {
	value: PropTypes.string,
	isDraft: PropTypes.bool,
	onChange: PropTypes.func,
};
const defaultProps = {
	value: 'private',
	isDraft: false,
	onChange: () => {},
};

const PubOptionsDropdownPrivacy = function(props) {
	const keySuffix = Math.round(Math.random() * 25000);
	const items = {
		private: {
			value: 'private',
			title: 'Private',
			icon: 'lock2',
			onClick: () => {
				props.onChange('private');
			},
		},
		publicView: {
			value: props.isDraft ? 'publicView' : 'public',
			title: props.isDraft ? 'Public View' : 'Public',
			icon: props.isDraft ? 'eye-open' : 'globe',
			onClick: () => {
				props.onChange(props.isDraft ? 'publicView' : 'public');
			},
		},
		publicEdit: {
			value: 'publicEdit',
			title: 'Public Edit',
			icon: 'edit2',
			onClick: () => {
				props.onChange('publicEdit');
			},
		},
	};
	return (
		<div className="pub-options-sharing-dropdown-privacy-component">
			<DropdownButton
				label={items[props.value].title}
				icon={items[props.value].icon}
				isRightAligned={true}
			>
				<ul className="pub-options-dropdown bp3-menu">
					{Object.keys(items)
						.filter((item, index) => {
							return props.isDraft || index < 2;
						})
						.map((key) => {
							const item = items[key];
							return (
								<li key={`${item.value}-option-${keySuffix}`}>
									<button
										className="bp3-menu-item bp3-popover-dismiss"
										onClick={item.onClick}
										type="button"
									>
										<Icon icon={item.icon} />
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

PubOptionsDropdownPrivacy.propTypes = propTypes;
PubOptionsDropdownPrivacy.defaultProps = defaultProps;
export default PubOptionsDropdownPrivacy;
