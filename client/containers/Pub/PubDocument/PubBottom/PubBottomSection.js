import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Button, Icon } from '@blueprintjs/core';

require('./pubBottomSection.scss');

const propTypes = {
	accentColor: PropTypes.string,
	centerItems: PropTypes.oneOf([PropTypes.func, PropTypes.node]),
	children: PropTypes.oneOf([PropTypes.func, PropTypes.node]),
	iconItems: PropTypes.node,
	isSearchable: PropTypes.bool,
	searchPlaceholder: PropTypes.string,
	title: PropTypes.node.isRequired,
};

const defaultProps = {
	accentColor: 'black',
	centerItems: [],
	children: null,
	iconItems: [],
	isSearchable: false,
	searchPlaceholder: 'Enter keywords to search for...',
};

export const AccentedIconButton = (props) => {
	const { accentColor, icon, ...buttonProps } = props;
	return <Button minimal icon={<Icon color={accentColor} icon={icon} />} {...buttonProps} />;
};

AccentedIconButton.propTypes = {
	accentColor: PropTypes.string.isRequired,
	icon: PropTypes.string.isRequired,
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
		searchPlaceholder,
		title,
	} = props;
	const [isExpanded, setIsExpanded] = useState();
	const [searchTerm, setSearchTerm] = useState(null);
	const isSearching = searchTerm !== null;

	const searchingTextStyle = isSearching ? { color: 'white' } : {};

	const renderSearchBar = () => {
		return (
			<input
				type="text"
				className="search-bar"
				onChange={(evt) => setSearchTerm(evt.target.value.trim())}
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
					onClick={() => setSearchTerm(null)}
				/>
			);
		}
		return (
			<AccentedIconButton
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
						? children({ searchTerm: searchTerm })
						: children}
				</div>
			)}
		</div>
	);
};

PubBottomSection.propTypes = propTypes;
PubBottomSection.defaultProps = defaultProps;
export default PubBottomSection;
