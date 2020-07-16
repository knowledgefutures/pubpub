import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import isUrl from 'is-url';

import { PubMenuItem } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { isDoi } from 'utils/crossref/parseDoi';
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

const indeterminateMenuItem = (
	<PubMenuItem
		key="indeterminate"
		title={'X'.repeat(50)}
		contributors={['ABC', 'XYZ']}
		isSkeleton={true}
		showImage={true}
		disabled={true}
	/>
);

const renderInputValue = () => '';

const NewEdgeInput = (props) => {
	const { availablePubs, usedPubIds, onSelectItem } = props;
	const [queryValue, setQueryValue] = useState('');
	const [suggestedItems, setSuggestedItems] = useState([]);
	const throttledQueryValue = useThrottled(queryValue, 250, true, true);

	useEffect(() => {
		if (isUrl(throttledQueryValue) || isDoi(throttledQueryValue)) {
			setSuggestedItems([{ indeterminate: true }]);
			apiFetch
				.get(`/api/pubEdgeProposal?object=${encodeURIComponent(throttledQueryValue)}`)
				.then((res) => {
					if (res) {
						setSuggestedItems([res]);
					} else {
						setSuggestedItems([{ createNewFromUrl: throttledQueryValue }]);
					}
				});
		} else if (throttledQueryValue) {
			setSuggestedItems(
				availablePubs
					.filter(
						(pub) =>
							fuzzyMatchPub(pub, throttledQueryValue) && !usedPubIds.includes(pub.id),
					)
					.slice(0, 5)
					.map((pub) => ({ targetPub: pub })),
			);
		} else {
			setSuggestedItems([]);
		}
	}, [availablePubs, throttledQueryValue, usedPubIds]);

	const renderItem = (item, { handleClick, modifiers }) => {
		const { externalPublication, targetPub, indeterminate } = item;
		if (indeterminate) {
			return indeterminateMenuItem;
		}
		if (targetPub) {
			return (
				<PubMenuItem
					key={targetPub.title}
					title={targetPub.title}
					contributors={targetPub.attributions}
					image={targetPub.avatar}
					active={modifiers.active}
					onClick={handleClick}
					showImage={true}
				/>
			);
		}
		if (externalPublication && externalPublication.title) {
			const { title, contributors, avatar } = externalPublication;
			return (
				<PubMenuItem
					key={title}
					title={title}
					contributors={contributors}
					image={avatar}
					onClick={handleClick}
					showImage={!!avatar}
					active={modifiers.active}
				/>
			);
		}
		return (
			<MenuItem
				key="from-url"
				onClick={handleClick}
				text="Create a connection for this URL"
			/>
		);
	};

	return (
		<Suggest
			className="new-edge-input-component"
			items={suggestedItems}
			inputProps={{
				large: true,
				placeholder: 'Search to add Pubs from this Community, or enter a URL or DOI',
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
