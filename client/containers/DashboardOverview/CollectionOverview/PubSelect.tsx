import React from 'react';
import { Popover, InputGroup } from '@blueprintjs/core';
import { QueryList } from '@blueprintjs/select';

import { PubMenuItem } from 'components';
import { fuzzyMatchPub } from 'utils/fuzzyMatch';

require('./pubSelect.scss');

type OwnProps = {
	children: React.ReactNode;
	onSelectPub: (...args: any[]) => any;
	position?: string;
	pubs: any[];
	usedPubIds?: string[];
};
const defaultProps = {
	position: 'bottom-right',
	usedPubIds: [],
};

type Props = OwnProps & typeof defaultProps;

const PubSelect = (props: Props) => {
	const { children, position, pubs, onSelectPub, usedPubIds } = props;

	const renderPubItem = (pub, { handleClick, modifiers: { active } }) => {
		return (
			<PubMenuItem
				key={pub.id}
				// @ts-expect-error ts-migrate(2322) FIXME: Property 'onClick' does not exist on type 'Intrins... Remove this comment to see the full error message
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type '"bottom-r... Remove this comment to see the full error message
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
PubSelect.defaultProps = defaultProps;
export default PubSelect;
