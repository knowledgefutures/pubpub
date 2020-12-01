import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import { Button, Icon } from '@blueprintjs/core';

require('./pubBottomSection.scss');

type OwnPubBottomSectionProps = {
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

const defaultProps = {
	accentColor: 'black',
	centerItems: [],
	children: null as React.ReactNode,
	className: '',
	defaultExpanded: false,
	iconItems: () => null,
	isExpandable: true,
	isSearchable: false,
	onSearch: () => {},
	searchPlaceholder: 'Enter keywords to search for...',
};

type OwnAccentedIconButtonProps = {
	accentColor: string;
	icon: string;
	title?: string;
};

// @ts-expect-error ts-migrate(2456) FIXME: Type alias 'AccentedIconButtonProps' circularly re... Remove this comment to see the full error message
type AccentedIconButtonProps = OwnAccentedIconButtonProps & typeof AccentedIconButton.defaultProps;

export const AccentedIconButton = (props: AccentedIconButtonProps) => {
	const { accentColor, icon, title, ...buttonProps } = props;
	return (
		<Button
			minimal
			icon={<Icon title={title} color={accentColor} icon={icon} iconSize={14} />}
			{...buttonProps}
		/>
	);
};

AccentedIconButton.defaultProps = {
	title: null,
};

export const SectionBullets = ({ children }) => {
	return (Array.isArray(children) ? children : [children]).map((item, i) => (
		// eslint-disable-next-line react/no-array-index-key
		<div key={i} className="center-content-item">
			{item}
		</div>
	));
};

type PubBottomSectionProps = OwnPubBottomSectionProps & typeof defaultProps;

const PubBottomSection = (props: PubBottomSectionProps) => {
	const {
		accentColor,
		centerItems,
		children,
		className,
		defaultExpanded,
		iconItems,
		isExpandable,
		isSearchable,
		onSearch,
		searchPlaceholder,
		title,
	} = props;
	const searchInputRef = useRef();
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const [searchTerm, setSearchTerm] = useState(null);
	const isSearching = searchTerm !== null;

	const searchingTextStyle = isSearching ? { color: 'white' } : {};

	useEffect(() => {
		if (isSearching && searchInputRef.current) {
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			searchInputRef.current.focus();
		}
	}, [isSearching]);

	const renderSearchBar = () => {
		return (
			<input
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
				ref={searchInputRef}
				type="text"
				className="search-bar"
				onChange={(evt) => {
					const value = evt.target.value.trim();
					onSearch(value);
					// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
					setSearchTerm(value);
				}}
				placeholder={searchPlaceholder}
			/>
		);
	};

	const renderCenterItems = () => {
		return typeof centerItems === 'function'
			? centerItems({ isExpanded: isExpanded })
			: centerItems;
	};

	const renderIconItems = () => {
		const iconColor = isSearching ? 'white' : accentColor;
		return typeof iconItems === 'function'
			? iconItems({ isExpanded: isExpanded, isSearching: isSearching, iconColor: iconColor })
			: iconItems;
	};

	const renderRightmostIcon = () => {
		if (isSearching) {
			return (
				<AccentedIconButton
					accentColor="white"
					icon="cross"
					title="Search this section"
					onClick={() => setSearchTerm(null)}
				/>
			);
		}
		if (!isExpandable) {
			return null;
		}
		return (
			<AccentedIconButton
				title={isExpanded ? 'Collapse this section' : 'Expand this section'}
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
							// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '""' is not assignable to paramet... Remove this comment to see the full error message
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
						? // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
						  children({ searchTerm: searchTerm, isSearching: isSearching })
						: children}
				</div>
			)}
		</div>
	);
};
PubBottomSection.defaultProps = defaultProps;
export default PubBottomSection;
