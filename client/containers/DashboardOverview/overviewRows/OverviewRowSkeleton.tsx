import React, { useCallback, useRef } from 'react';
import classNames from 'classnames';

import { Icon, IconName } from 'client/components';
import { usePageContext } from 'utils/hooks';

import { iconSize } from './constants';

require('./overviewRowSkeleton.scss');

type Props = {
	className?: string;
	href: string;
	leftIcon: React.ReactNode | IconName;
	title: React.ReactNode;
	byline?: React.ReactNode;
	rightElement?: React.ReactNode;
	darkenRightIcons?: boolean;
	details: React.ReactNode;
	withBorder?: boolean;
	withHoverEffect?: boolean;
	isGrayscale?: boolean;
	onClick?: React.MouseEventHandler<any>;
};

const OverviewRowSkeleton = React.forwardRef((props: Props, ref: any) => {
	const {
		className,
		leftIcon,
		details,
		title,
		byline,
		rightElement = null,
		withBorder = true,
		withHoverEffect = false,
		darkenRightIcons = false,
		isGrayscale = false,
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
			style={{ ...(!isGrayscale && { color: communityData.accentColorDark }) }}
			className={classNames(
				'overview-row-skeleton-component',
				isGrayscale && 'is-grayscale',
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
				{details}
			</div>
			<div className={classNames('right-element', darkenRightIcons && 'darker')}>
				{rightElement}
			</div>
		</div>
	);
});

export default OverviewRowSkeleton;
