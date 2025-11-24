import React, { useCallback, useRef } from 'react';

import classNames from 'classnames';

import { Icon, type IconName } from 'components';

import { iconSize } from './constants';

import './overviewRowSkeleton.scss';

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
		onClick,
		href,
	} = props;

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
		// biome-ignore lint/a11y/noNoninteractiveElementInteractions: shhhhhh
		// biome-ignore lint/a11y/noStaticElementInteractions: shhhhhh
		<div
			onClick={onClick}
			ref={ref}
			onMouseDown={handleMouseDown}
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
				{details}
			</div>
			<div className={classNames('right-element', darkenRightIcons && 'darker')}>
				{rightElement}
			</div>
		</div>
	);
});

export default OverviewRowSkeleton;
