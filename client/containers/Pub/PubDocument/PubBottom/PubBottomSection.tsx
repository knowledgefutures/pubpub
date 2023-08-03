import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Button, Icon } from '@blueprintjs/core';

require('./pubBottomSection.scss');

type AccentedIconButtonProps = {
	accentColor: string;
	icon: string;
	title?: string;
} & React.ComponentProps<typeof Button>;

export const AccentedIconButton = React.forwardRef((props: AccentedIconButtonProps, ref: any) => {
	const { accentColor, icon, title = null, ...buttonProps } = props;
	return (
		<Button
			minimal
			elementRef={ref}
			icon={<Icon title={title} color={accentColor} icon={icon as any} iconSize={14} />}
			{...buttonProps}
		/>
	);
});

export const SectionBullets = ({ children }: { children: React.ReactNode }) => {
	return (
		<>
			{React.Children.map(children, (item, i) => (
				// eslint-disable-next-line react/no-array-index-key
				<div key={i} className="center-content-item">
					{item}
				</div>
			))}
		</>
	);
};

type PubBottomSectionProps = {
	accentColor?: string;
	centerItems?: ((...args: any[]) => any) | React.ReactNode;
	children?: ((...args: any[]) => any) | React.ReactNode;
	className?: string;
	defaultExpanded?: boolean;
	iconItems?: (...args: any[]) => any;
	isExpandable?: boolean;
	isSearchable?: boolean;
	searchPlaceholder?: string;
	onSearch?: (...args: any[]) => any;
	title: React.ReactNode;
};

const PubBottomSection = (props: PubBottomSectionProps) => {
	const {
		accentColor = 'back',
		centerItems = [],
		children = null,
		className = '',
		defaultExpanded = false,
		iconItems = () => null,
		isExpandable = true,
		isSearchable = false,
		onSearch = () => {},
		searchPlaceholder = 'Enter keywords to search for...',
		title,
	} = props;
	const searchInputRef = useRef<HTMLInputElement | null>(null);
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const [searchTerm, setSearchTerm] = useState<string | null>(null);
	const isSearching = searchTerm !== null;

	const searchingTextStyle = isSearching ? { color: 'white' } : {};

	useEffect(() => {
		if (isSearching && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [isSearching]);

	const renderSearchBar = () => {
		return (
			<input
				ref={searchInputRef}
				type="text"
				className="search-bar"
				onChange={(evt) => {
					const value = evt.target.value.trim();
					onSearch(value);
					setSearchTerm(value);
				}}
				placeholder={searchPlaceholder}
			/>
		);
	};

	const renderCenterItems = () => {
		return typeof centerItems === 'function' ? centerItems({ isExpanded }) : centerItems;
	};

	const renderIconItems = () => {
		const iconColor = isSearching ? 'white' : accentColor;
		return typeof iconItems === 'function'
			? iconItems({ isExpanded, isSearching, iconColor })
			: iconItems;
	};

	const renderRightmostIcon = () => {
		if (isSearching) {
			return (
				<AccentedIconButton
					accentColor="white"
					icon="cross"
					aria-label="Search this section"
					onClick={() => setSearchTerm(null)}
				/>
			);
		}
		if (!isExpandable) {
			return null;
		}
		return (
			<AccentedIconButton
				aria-label={isExpanded ? 'Collapse this section' : 'Expand this section'}
				accentColor={accentColor}
				icon={isExpanded ? 'collapse-all' : 'expand-all'}
				onClick={() => setIsExpanded(!isExpanded)}
			/>
		);
	};

	const largeExpandClickTarget = isExpandable && !isSearching;

	return (
		<div
			className={classNames(
				'pub-bottom-section-component',
				className,
				isSearching && 'searching',
				isExpanded && 'expanded',
			)}
		>
			{/* We already have a fully interactive expand button -- this is a bonus */}
			{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
			<div
				role={largeExpandClickTarget ? 'button' : 'none'}
				onClick={largeExpandClickTarget ? () => setIsExpanded(!isExpanded) : undefined}
				className="top-row"
				style={{
					...(isSearching && { background: accentColor }),
					...(largeExpandClickTarget && { cursor: 'pointer' }),
				}}
			>
				<div className="left-title" style={searchingTextStyle}>
					{title}
				</div>
				<div className="center-content">
					{isSearching ? renderSearchBar() : renderCenterItems()}
				</div>
				<div
					className="right-icons"
					style={searchingTextStyle}
					// Use this handler to prevent clicking on the icon content from closing
					// the entire section.
					onClick={(e) => e.stopPropagation()}
					role="none"
				>
					{isExpanded && isSearchable && !isSearching && (
						<AccentedIconButton
							accentColor={accentColor}
							icon="search"
							aria-label="Search comments"
							onClick={() => setSearchTerm('')}
						/>
					)}
					{renderIconItems()}
					{renderRightmostIcon()}
				</div>
			</div>
			{isExpanded && (
				<div className="section-content">
					{typeof children === 'function'
						? children({ searchTerm, isSearching })
						: children}
				</div>
			)}
		</div>
	);
};

export default PubBottomSection;
