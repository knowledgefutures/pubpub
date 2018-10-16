import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'components/Icon/Icon';

require('./dropdownRichItem.scss');

const propTypes = {
	title: PropTypes.string.isRequired,
	icon: PropTypes.string,
	description: PropTypes.string,
	hideBottomBorder: PropTypes.bool,
	onClick: PropTypes.func,
};

const defaultProps = {
	icon: undefined,
	description: undefined,
	hideBottomBorder: false,
	onClick: ()=>{},
};

const DropdownRichItem = function(props) {
	return (
		<div className={`dropdown-rich-item-component ${props.hideBottomBorder ? 'no-border' : ''} pt-menu-item pt-popover-dismiss`} onClick={props.onClick}>
			{props.icon &&
				<Icon icon={props.icon} />
			}

			<div className="title">{props.title}</div>

			{props.description &&
				<div className="description">{props.description}</div>
			}

		</div>
	);
};

DropdownRichItem.defaultProps = defaultProps;
DropdownRichItem.propTypes = propTypes;
export default DropdownRichItem;
