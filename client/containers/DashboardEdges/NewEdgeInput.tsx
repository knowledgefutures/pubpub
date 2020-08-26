import React, { useState, useEffect } from 'react';
import { MenuItem, Position } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import isUrl from 'is-url';

import { PubMenuItem } from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { isDoi } from 'utils/crossref/parseDoi';
import { useThrottled } from 'utils/hooks';
import { fuzzyMatchPub } from 'utils/fuzzyMatch';

require('./newEdgeInput.scss');

type Props = {
	availablePubs: {
		title?: string;
		avatar?: string;
	}[];
	onSelectItem: (...args: any[]) => any;
	usedPubIds: string[];
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
		// @ts-expect-error ts-migrate(2322) FIXME: Property 'title' does not exist on type 'Intrinsic... Remove this comment to see the full error message
		title={'X'.repeat(50)}
		contributors={['ABC', 'XYZ']}
		isSkeleton={true}
		showImage={true}
		disabled={true}
		onClick={() => {}}
	/>
);

const renderInputValue = () => '';

const NewEdgeInput = (props: Props) => {
	const { availablePubs, usedPubIds, onSelectItem } = props;
	const [queryValue, setQueryValue] = useState('');
	const [suggestedItems, setSuggestedItems] = useState([]);
	const throttledQueryValue = useThrottled(queryValue, 250, true, true);

	useEffect(() => {
		if (isUrl(throttledQueryValue) || isDoi(throttledQueryValue)) {
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'never'.
			setSuggestedItems([{ indeterminate: true }]);
			apiFetch
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'get' does not exist on type '(path: any,... Remove this comment to see the full error message
				.get(`/api/pubEdgeProposal?object=${encodeURIComponent(throttledQueryValue)}`)
				.then((res) => {
					if (res) {
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
						setSuggestedItems([res]);
					} else {
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
						setSuggestedItems([{ createNewFromUrl: throttledQueryValue }]);
					}
				});
		} else if (throttledQueryValue) {
			setSuggestedItems(
				// @ts-expect-error ts-migrate(2345) FIXME: Type '{ targetPub: { title?: string | undefined; a... Remove this comment to see the full error message
				availablePubs
					.filter(
						(pub) =>
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{ title?: st... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'title' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2322) FIXME: Property 'title' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
			// @ts-expect-error ts-migrate(2769) FIXME: Type '{ wrapperTagName: string; minimal: boolean; ... Remove this comment to see the full error message
			popoverProps={suggestPopoverProps}
		/>
	);
};
export default NewEdgeInput;
