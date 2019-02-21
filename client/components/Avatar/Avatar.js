import React from 'react';
import PropTypes from 'prop-types';
import { getResizedUrl } from 'utilities';

require('./avatar.scss');

const propTypes = {
	userInitials: PropTypes.string,
	userAvatar: PropTypes.string,

	instanceNumber: PropTypes.number,
	borderColor: PropTypes.string,
	borderWidth: PropTypes.string,
	width: PropTypes.number.isRequired, // Integer number of pixels for avatar
	doesOverlap: PropTypes.bool, // Boolean on whether a lisst of avatars will be overlapping
};

const defaultProps = {
	userAvatar: undefined,
	userInitials: '?',
	instanceNumber: undefined,
	borderColor: undefined,
	borderWidth: undefined,
	doesOverlap: false,
};

const Avatar = function(props) {
	const avatarStyle = {
		width: props.width,
		height: props.width,
		borderColor: props.borderColor,
		borderWidth: props.borderColor ? props.borderWidth || Math.floor(props.width / 50) + 1 : 0,
		fontSize: Math.floor(props.width / 2.5),
		zIndex: props.instanceNumber ? -1 * props.instanceNumber : 'initial',
	};

	const resizedImageUrl =
		props.width <= 50
			? getResizedUrl(props.userAvatar, null, '50x50')
			: getResizedUrl(props.userAvatar, null, '250x250');

	if (props.doesOverlap) {
		avatarStyle.marginRight = `${props.width * 0.45 * -1}px`;
	}
	if (props.userAvatar) {
		avatarStyle.backgroundImage = `url("${resizedImageUrl}")`;
	}

	return (
		<div className="avatar-component" style={avatarStyle}>
			{!props.userAvatar && <div>{props.userInitials}</div>}
		</div>
	);
};

Avatar.defaultProps = defaultProps;
Avatar.propTypes = propTypes;
export default Avatar;
