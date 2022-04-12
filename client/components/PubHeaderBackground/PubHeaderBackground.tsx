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

const PubHeaderBackground = React.forwardRef((props: Props, ref: React.Ref<any>) => {
	const {
		children = null,
		className = '',
		pubData,
		communityData,
		blur = false,
		style = {},
		safetyLayer = null,
	} = props;
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

export default PubHeaderBackground;
