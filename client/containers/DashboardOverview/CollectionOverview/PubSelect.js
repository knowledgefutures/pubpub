import React from 'react';
import PropTypes from 'prop-types';
import { Popover, InputGroup } from '@blueprintjs/core';
import { QueryList } from '@blueprintjs/select';

import { PubMenuItem } from 'components';
import { fuzzyMatchPub } from 'utils/fuzzyMatch';

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

	const renderPubItem = (pub, { handleClick, modifiers: { active } }) => {
		return (
			<PubMenuItem
				key={pub.id}
				onClick={handleClick}
				title={pub.title}
				contributors={pub.attributions}
				active={active}
			/>
		);
	};
	const renderPopoverContent = (qlProps) => {
		const { handleKeyDown, handleKeyUp, handleQueryChange, itemList } = qlProps;
		return (
			// eslint-disable-next-line jsx-a11y/no-static-element-interactions
			<div className="pub-select-ui" onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
				<InputGroup
					inputRef={(input) => input && input.focus()}
					placeholder="Search for Pubs"
					leftIcon="search"
					onChange={handleQueryChange}
				/>
				{itemList}
			</div>
		);
	};

	// eslint-disable-next-line react/prop-types
	const queryListRenderer = (qlProps) => {
		return (
			<Popover
				minimal
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
