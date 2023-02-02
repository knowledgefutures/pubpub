import React from 'react';
import classNames from 'classnames';

import { calculateBackgroundColor } from 'utils/colors';
import { FacetValue, PubHeaderTheme } from 'facets';

require('./pubHeaderBackground.scss');

type Props = {
	children?: React.ReactNode;
	className?: string;
	communityData: {
		accentColorDark?: string;
	};
	blur?: boolean;
	style?: any;
	safetyLayer?: 'enabled' | 'full-height';
	pubHeaderTheme: FacetValue<typeof PubHeaderTheme>;
};

const PubHeaderBackground = React.forwardRef((props: Props, ref: React.Ref<any>) => {
	const {
		children = null,
		className = '',
		communityData,
		blur = false,
		style = {},
		safetyLayer = null,
		pubHeaderTheme: { textStyle, backgroundColor, backgroundImage },
	} = props;

	const effectiveBackgroundColor = calculateBackgroundColor(
		backgroundColor,
		communityData.accentColorDark,
	);

	return (
		<div
			className={classNames(
				'pub-header-background-component',
				`pub-header-theme-${textStyle}`,
				className,
			)}
			style={style}
			ref={ref}
		>
			<div className="background-element background-white-layer" />
			{backgroundImage && (
				<div
					className={classNames('background-element', 'background-image', blur && 'blur')}
					style={{ backgroundImage: `url('${backgroundImage}')` }}
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
