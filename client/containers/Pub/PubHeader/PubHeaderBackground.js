import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Color from 'color';

require('./pubHeaderBackground.scss');

const propTypes = {
	children: PropTypes.node,
	className: PropTypes.string,
	pubData: PropTypes.shape({}).isRequired,
	blur: PropTypes.bool,
};

const defaultProps = {
	className: '',
	children: null,
	blur: false,
};

const PubHeaderBackground = React.forwardRef((props, ref) => {
	const { children, className, pubData, communityData, blur } = props;
	const { headerBackgroundColor, headerBackgroundImage } = pubData;
	const effectiveBackgroundColor =
		headerBackgroundColor && headerBackgroundColor === 'community'
			? Color(communityData.accentColorDark).alpha(0.75)
			: headerBackgroundColor;
	return (
		<div className={classNames('pub-header-background-component', className)} ref={ref}>
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
