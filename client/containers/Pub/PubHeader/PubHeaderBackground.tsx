import React from 'react';
import classNames from 'classnames';

import { calculateBackgroundColor } from 'utils/colors';

require('./pubHeaderBackground.scss');

type Props = {
	children?: React.ReactNode;
	className?: string;
	communityData: {
		accentColorDark?: string;
	};
	pubData: {
		headerBackgroundColor?: string;
		headerBackgroundImage?: string;
		headerStyle?: string;
	};
	blur?: boolean;
	style?: any;
	safetyLayer?: 'enabled' | 'full-height';
};

const defaultProps = {
	className: '',
	children: null,
	blur: false,
	style: {},
	safetyLayer: null,
};

const PubHeaderBackground = React.forwardRef<any, Props>((props, ref) => {
	const { children, className, pubData, communityData, blur, style, safetyLayer } = props;
	const { headerBackgroundColor, headerBackgroundImage } = pubData;

	const effectiveBackgroundColor = calculateBackgroundColor(
		headerBackgroundColor,
		communityData.accentColorDark,
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
					style={{ backgroundImage: `url('${headerBackgroundImage}')` }}
				/>
			)}
			{effectiveBackgroundColor && (
				<div
					className="background-element background-color"
					style={{ backgroundColor: effectiveBackgroundColor }}
				/>
			)}
			{!!safetyLayer && (
				<div
					className={classNames(
						'background-element',
						'background-safety-layer',
						safetyLayer === 'full-height' && 'full-height',
					)}
				/>
			)}
			{children}
		</div>
	);
});
// @ts-expect-error ts-migrate(2322) FIXME: Type '{ className: string; children: null; blur: b... Remove this comment to see the full error message
PubHeaderBackground.defaultProps = defaultProps;
export default PubHeaderBackground;
