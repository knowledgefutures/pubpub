import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getResizedUrl } from 'utils';

import { calculateBackgroundColor } from './colors';

require('./pubHeaderBackground.scss');

const propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
	pubData: PropTypes.shape({}).isRequired,
	blur: PropTypes.bool,
	style: PropTypes.object,
	showTopBar: PropTypes.bool,
};

const defaultProps = {
	className: '',
	children: null,
	blur: false,
	style: {},
	showTopBar: false,
};

const getHeaderImageWidth = () => {
	if (typeof window !== 'undefined') {
		return window.innerWidth;
	}
	return 1500;
};

const PubHeaderBackground = React.forwardRef((props, ref) => {
	const { children, className, pubData, communityData, blur, style, showTopBar } = props;
	const { headerBackgroundColor, headerBackgroundImage } = pubData;

	const effectiveBackgroundColor = calculateBackgroundColor(
		headerBackgroundColor,
		communityData.accentColorDark,
	);

	const effectiveHeaderBackgroundImage = getResizedUrl(
		headerBackgroundImage,
		'fit-in',
		`${getHeaderImageWidth()}x600`,
	);

	return (
		<div
			className={classNames(
				'pub-header-background-component',
				`pub-header-theme-${pubData.headerStyle}`,
				className,
			)}
			style={style}
			ref={ref}
		>
			<div className="background-element background-white-layer" />
			{headerBackgroundImage && (
				<div
					className={classNames('background-element', 'background-image', blur && 'blur')}
					style={{ backgroundImage: `url('${effectiveHeaderBackgroundImage}')` }}
				/>
			)}
			{effectiveBackgroundColor && (
				<div
					className="background-element background-color"
					style={{ backgroundColor: effectiveBackgroundColor }}
				/>
			)}
			{showTopBar && <div className="background-element background-top-bar" />}
			{children}
		</div>
	);
});

PubHeaderBackground.propTypes = propTypes;
PubHeaderBackground.defaultProps = defaultProps;
export default PubHeaderBackground;
