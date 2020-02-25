import React from 'react';
import PropTypes from 'prop-types';
import { Popover, InputGroup } from '@blueprintjs/core';
import { QueryList } from '@blueprintjs/select';

import { fuzzyMatchPub } from './util';
import ContentRow from './ContentRow';

require('./pubSelect.scss');

const propTypes = {
	children: PropTypes.node.isRequired,
	onSelectPub: PropTypes.func.isRequired,
	position: PropTypes.string,
	pubs: PropTypes.arrayOf(PropTypes.object).isRequired,
	usedPubIds: PropTypes.arrayOf(PropTypes.string),
};
const defaultProps = {
	position: 'bottom-right',
	usedPubIds: [],
};

const PubSelect = (props) => {
	const { children, position, pubs, onSelectPub, usedPubIds } = props;

	const renderPubItem = (pub, { handleClick, modifiers: { active } }) => (
		<ContentRow
			content={pub}
			key={pub.id}
			minimal={true}
			selected={active}
			onClick={handleClick}
		/>
	);

	const renderPopoverContent = (qlProps) => {
		const { handleKeyDown, handleKeyUp, handleQueryChange, itemList } = qlProps;
		return (
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div className="pub-select-ui" onKeyDown={handleKeyUp} onKeyUp={handleKeyUp}>
				<InputGroup
					inputRef={(input) => input && input.focus()}
					placeholder="Search for Pubs"
					leftIcon="search"
					onChange={handleQueryChange}
					onKeyDown={handleKeyDown}
					onKeyUp={handleKeyUp}
				/>
				{itemList}
			</div>
		);
	};

	// eslint-disable-next-line react/prop-types
	const queryListRenderer = (qlProps) => {
		return (
			<Popover
				popoverClassName="pub-select-popover"
				position={position}
				content={renderPopoverContent(qlProps)}
			>
				{children}
			</Popover>
		);
	};

	return (
		<QueryList
			renderer={queryListRenderer}
			itemRenderer={renderPubItem}
			items={pubs.filter((pub) => !usedPubIds.includes(pub.id))}
			itemPredicate={(query, pub) => fuzzyMatchPub(pub, query)}
			onItemSelect={onSelectPub}
			noResults={<div className="empty-list">No Pubs to show.</div>}
		/>
	);
};

PubSelect.propTypes = propTypes;
PubSelect.defaultProps = defaultProps;
export default PubSelect;
