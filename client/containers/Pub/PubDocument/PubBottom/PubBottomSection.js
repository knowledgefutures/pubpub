import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Button, Icon } from '@blueprintjs/core';

require('./pubBottomSection.scss');

const propTypes = {
	accentColor: PropTypes.string,
	centerItems: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
	children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
	iconItems: PropTypes.node,
	isSearchable: PropTypes.bool,
	searchPlaceholder: PropTypes.string,
	onSearch: PropTypes.func,
	title: PropTypes.node.isRequired,
};

const defaultProps = {
	accentColor: 'black',
	centerItems: [],
	children: null,
	iconItems: [],
	isSearchable: false,
	onSearch: () => {},
	searchPlaceholder: 'Enter keywords to search for...',
};

export const AccentedIconButton = (props) => {
	const { accentColor, icon, title, ...buttonProps } = props;
	return (
		<Button
			minimal
			icon={<Icon title={title} color={accentColor} icon={icon} />}
			{...buttonProps}
		/>
	);
};

AccentedIconButton.propTypes = {
	accentColor: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
};

export const SectionBullets = ({ children }) => {
	return (Array.isArray(children) ? children : [children]).map((item, i) => (
		// eslint-disable-next-line react/no-array-index-key
		<div key={i} className="center-content-item">
			{item}
		</div>
	));
};

const PubBottomSection = (props) => {
	const {
		accentColor,
		centerItems,
		children,
		iconItems,
		isSearchable,
		onSearch,
		searchPlaceholder,
		title,
	} = props;
	const searchInputRef = useRef();
	const [isExpanded, setIsExpanded] = useState();
	const [searchTerm, setSearchTerm] = useState(null);
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
		return (
			<AccentedIconButton
				title={isExpanded ? 'Collapse this section' : 'Expand this section'}
				accentColor={accentColor}
				icon={isExpanded ? 'collapse-all' : 'expand-all'}
				onClick={() => setIsExpanded(!isExpanded)}
			/>
		);
	};

	return (
		<div
			className={classNames(
				'pub-bottom-section-component',
				isSearching && 'searching',
				isExpanded && 'expanded',
			)}
		>
			<div
				className="top-row"
				style={{
					...(isSearching && { background: accentColor }),
				}}
			>
				<div className="left-title" style={searchingTextStyle}>
					{title}
				</div>
				<div className="center-content">
					{isSearching ? renderSearchBar() : renderCenterItems()}
				</div>
				<div className="right-icons" style={searchingTextStyle}>
					{isExpanded && isSearchable && !isSearching && (
						<AccentedIconButton
							accentColor={accentColor}
							icon="search"
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
						? children({ searchTerm: searchTerm, isSearching: isSearching })
						: children}
				</div>
			)}
		</div>
	);
};

PubBottomSection.propTypes = propTypes;
PubBottomSection.defaultProps = defaultProps;
export default PubBottomSection;
