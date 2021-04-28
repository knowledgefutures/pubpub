import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';

import { Icon, IconName } from 'client/components';
import { usePageContext } from 'utils/hooks';

import { iconSize } from './constants';

require('./overviewRowSkeleton.scss');

export type IconLabelPair = {
	icon: IconName;
	label: string | React.ReactNode;
	iconSize?: number;
};

type Props = {
	className?: string;
	href: string;
	leftIcon: React.ReactNode | IconName;
	title: React.ReactNode;
	byline?: React.ReactNode;
	rightElement?: React.ReactNode;
	iconLabelPairs: IconLabelPair[];
	withBorder?: boolean;
	withHoverEffect?: boolean;
	onClick?: React.MouseEventHandler<any>;
};

const OverviewRowSkeleton = React.forwardRef((props: Props, ref: any) => {
	const {
		className,
		leftIcon,
		iconLabelPairs,
		title,
		byline,
		rightElement = null,
		withBorder = true,
		withHoverEffect = false,
		onClick,
		href,
	} = props;

	const { communityData } = usePageContext();
	const centerContainerRef = useRef<null | HTMLDivElement>(null);

	const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		// Disable text selection on double-click of text-free areas
		if (e.target === centerContainerRef.current) {
			e.preventDefault();
		}
	}, []);

	const handleClickTitle = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
		e.stopPropagation();
	}, []);

	const leftIconElement =
		typeof leftIcon === 'string' ? (
			<Icon icon={leftIcon as IconName} className="left-icon" iconSize={iconSize} />
		) : (
			leftIcon
		);

	return (
		// This click handler is a convenience for mouse users; the same handler should be made
		// available in the rightElement (e.g. to disclose a Collection row)
		// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			onClick={onClick}
			ref={ref}
			onMouseDown={handleMouseDown}
			style={{ color: communityData.accentColorDark }}
			className={classNames(
				'overview-row-skeleton-component',
				withHoverEffect && 'with-hover-effect',
				withBorder && 'with-border',
				className,
			)}
		>
			{leftIconElement}
			<div className="center-container" ref={centerContainerRef}>
				<a href={href} className="title" onClick={handleClickTitle}>
					{title}
				</a>
				{byline && <div className="byline">{byline}</div>}
				<div className="summary-icons">
					{iconLabelPairs.map((iconLabelPair, index) => {
						const { icon, label, iconSize: iconLabelPairIconSize = 12 } = iconLabelPair;
						const iconElement =
							typeof icon === 'string' ? (
								<Icon icon={icon} iconSize={iconLabelPairIconSize} />
							) : (
								icon
							);
						return (
							<div
								className="summary-icon-pair"
								// eslint-disable-next-line react/no-array-index-key
								key={index}
							>
								{iconElement}
								{label}
							</div>
						);
					})}
				</div>
			</div>
			<div className="right-element">{rightElement}</div>
		</div>
	);
});

export default OverviewRowSkeleton;
