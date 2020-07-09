import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import isUrl from 'is-url';

import { PubMenuItem } from 'components';
import { useThrottled } from 'utils/hooks';
import { fuzzyMatchPub } from 'utils/fuzzyMatch';

require('./newEdgeInput.scss');

const propTypes = {
	availablePubs: PropTypes.arrayOf(
		PropTypes.shape({
			title: PropTypes.string,
			avatar: PropTypes.string,
		}),
	).isRequired,
	onSelectItem: PropTypes.func.isRequired,
	usedPubIds: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const suggestPopoverProps = {
	wrapperTagName: 'div',
	minimal: true,
	position: Position.BOTTOM_LEFT,
	modifiers: {
		preventOverflow: { enabled: false },
		hide: { enabled: false },
	},
	usePortal: false,
};

const renderInputValue = () => '';

const NewEdgeInput = (props) => {
	const { availablePubs, usedPubIds, onSelectItem } = props;
	const [queryValue, setQueryValue] = useState('');
	const [suggestedItems, setSuggestedItems] = useState([]);
	const throttledQueryValue = useThrottled(queryValue, 250, true, true);

	useEffect(() => {
		if (isUrl(throttledQueryValue)) {
			setSuggestedItems([]);
		} else if (throttledQueryValue) {
			setSuggestedItems(
				availablePubs
					.filter(
						(pub) =>
							fuzzyMatchPub(pub, throttledQueryValue) && !usedPubIds.includes(pub.id),
					)
					.slice(0, 5)
					.map((pub) => ({ type: 'pub', pub: pub })),
			);
		} else {
			setSuggestedItems([]);
		}
	}, [availablePubs, throttledQueryValue, usedPubIds]);

	const renderItem = (item, { handleClick, modifiers }) => {
		const { type, pub } = item;
		if (type === 'pub') {
			return (
				<PubMenuItem
					pubData={pub}
					active={modifiers.active}
					onClick={handleClick}
					showImage={true}
				/>
			);
		}
		return null;
	};

	return (
		<Suggest
			className="new-edge-input-component"
			items={suggestedItems}
			inputProps={{
				large: true,
				placeholder: 'Search to add Pubs from this Community, or enter a URL',
			}}
			inputValueRenderer={renderInputValue}
			onQueryChange={(query) => setQueryValue(query.trim())}
			itemRenderer={renderItem}
			resetOnSelect={true}
			onItemSelect={onSelectItem}
			noResults={queryValue ? <MenuItem disabled text="No results" /> : null}
			popoverProps={suggestPopoverProps}
		/>
	);
};

NewEdgeInput.propTypes = propTypes;
export default NewEdgeInput;
