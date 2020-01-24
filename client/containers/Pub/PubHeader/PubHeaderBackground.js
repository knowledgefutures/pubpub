import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { calculateBackgroundColor } from './colors';

require('./pubHeaderBackground.scss');

const propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
	pubData: PropTypes.shape({}).isRequired,
	blur: PropTypes.bool,
	style: PropTypes.object,
};

const defaultProps = {
	className: '',
	children: null,
	blur: false,
	style: {},
};

const PubHeaderBackground = React.forwardRef((props, ref) => {
	const { children, className, pubData, communityData, blur, style } = props;
	const { headerBackgroundColor, headerBackgroundImage } = pubData;
	const effectiveBackgroundColor = calculateBackgroundColor(
		headerBackgroundColor,
		communityData.accentColorDark,
	);
	return (
		<div
			className={classNames('pub-header-background-component', className)}
			style={style}
			ref={ref}
		>
			{headerBackgroundImage && (
				<div
					className={classNames('background-element', 'background-image', blur && 'blur')}
					style={{ backgroundImage: `url('${headerBackgroundImage}')` }}
				/>
			)}
			{effectiveBackgroundColor && (
				<div
					className="background-element background-color"
					style={{ backgroundColor: effectiveBackgroundColor }}
				/>
			)}
			<div className="background-element background-dark-tint" />
			{children}
		</div>
	);
});

PubHeaderBackground.propTypes = propTypes;
PubHeaderBackground.defaultProps = defaultProps;
export default PubHeaderBackground;
