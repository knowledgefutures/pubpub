import React from 'react';
import classNames from 'classnames';

import { getResizedUrl } from 'utils/images';
import { usePageContext } from 'utils/hooks';

require('./avatar.scss');

type Props = {
	width: number;
	initials?: string;
	avatar?: string;
	instanceNumber?: number;
	borderColor?: string;
	borderWidth?: number | string;
	doesOverlap?: boolean;
	isBlock?: boolean;
	className?: string;
};

const Avatar = (props: Props) => {
	const {
		initials = '?',
		avatar,
		instanceNumber,
		borderColor,
		borderWidth,
		width,
		doesOverlap,
		isBlock,
		className,
	} = props;
	const { communityData } = usePageContext();

	const avatarStyle: React.CSSProperties = {
		width,
		minWidth: width,
		height: width,
		borderColor,
		borderWidth: borderColor ? borderWidth || Math.floor(width / 50) + 1 : 0,
		fontSize: isBlock ? Math.floor(width / 1.5) : Math.floor(width / 2.5),
		backgroundColor: communityData.accentColorDark,
		zIndex: typeof instanceNumber === 'number' ? -1 * instanceNumber : 'initial',
		borderRadius: isBlock ? '2px' : '50%',
	};

	const imageSize = width <= 50 ? 50 : 250;
	const resizedImageUrl = getResizedUrl(avatar, 'cover', imageSize, imageSize);

	if (doesOverlap) {
		avatarStyle.marginRight = `${width * 0.45 * -1}px`;
	}
	if (avatar) {
		avatarStyle.backgroundImage = `url("${resizedImageUrl}")`;
	}

	return (
		<div className={classNames(['avatar-component', className])} style={avatarStyle}>
			{!avatar && <div>{initials}</div>}
		</div>
	);
};

export default Avatar;
