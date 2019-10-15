import React from 'react';
import PropTypes from 'prop-types';
import { getResizedUrl } from 'utils';

require('./avatarBlock.scss');

const propTypes = {
	avatar: PropTypes.string,
	title: PropTypes.string,
	width: PropTypes.number.isRequired,
	communityData: PropTypes.object.isRequired,
};

const defaultProps = {
	avatar: undefined,
	title: '?',
};

const AvatarBlock = (props) => {
	const avatarStyle = {
		width: props.width,
		minWidth: props.width,
		height: props.width,
		minHeight: props.width,
		fontSize: Math.floor(props.width / 1.5),
		backgroundColor: props.communityData.accentColorDark,
	};

	const resizedImageUrl =
		props.width <= 50
			? getResizedUrl(props.avatar, null, '50x50')
			: getResizedUrl(props.avatar, null, '250x250');

	if (props.avatar) {
		avatarStyle.backgroundImage = `url("${resizedImageUrl}")`;
	}
	return (
		<div className="avatar-block" style={avatarStyle}>
			{!props.avatar && <div>{props.title[0]}</div>}
		</div>
	);
};

AvatarBlock.propTypes = propTypes;
AvatarBlock.defaultProps = defaultProps;
export default AvatarBlock;
