import type { ExternalPublication, Pub } from 'types';

import React, { useEffect, useState } from 'react';

import { MenuItem, Position, Spinner } from '@blueprintjs/core';
import { Suggest } from '@blueprintjs/select';
import isUrl from 'is-url';

import { apiFetch } from 'client/utils/apiFetch';
import { useManyPubs } from 'client/utils/useManyPubs';
import { PubMenuItem, PubTitle } from 'components';
import { isDoi } from 'utils/crossref/parseDoi';
import { useThrottled } from 'utils/hooks';

import './newEdgeInput.scss';

type Props = {
	onSelectItem: (...args: any[]) => any;
	usedPubIds: string[];
};

type SuggestedItem =
	| {
			targetPub?: Pub;
			externalPublication?: ExternalPublication;
	  }
	| { indeterminate: true }
	| { createNewFromUrl: string };

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
		id={null}
		onClick={() => {}}
	/>
);

const renderInputValue = () => '';

const NewEdgeInput = (props: Props) => {
	const { usedPubIds, onSelectItem } = props;
	const [queryValue, setQueryValue] = useState('');
	const throttledQueryValue = useThrottled(queryValue, 250, true, true);
	const [pubSearchTerm, setPubSearchTerm] = useState<null | string>(null);
	const [proposedItem, setProposedItem] = useState<null | SuggestedItem>(null);

	const {
		allQueries: { isLoading },
		currentQuery: { pubs },
	} = useManyPubs({ query: { term: pubSearchTerm || '' }, batchSize: 5 });

	const suggestedItems = proposedItem ? [proposedItem] : pubs.map((pub) => ({ targetPub: pub }));

	useEffect(() => {
		if (isUrl(throttledQueryValue) || isDoi(throttledQueryValue)) {
			setProposedItem({ indeterminate: true });
			apiFetch
				.get(`/api/pubEdgeProposal?object=${encodeURIComponent(throttledQueryValue)}`)
				.then((res) => {
					if (res) {
						setProposedItem(res);
					} else {
						setProposedItem({ createNewFromUrl: throttledQueryValue });
					}
				});
		} else {
			setPubSearchTerm(throttledQueryValue);
			setProposedItem(null);
		}
	}, [throttledQueryValue, usedPubIds]);

	const renderItem = (item: SuggestedItem, { handleClick, modifiers }) => {
		if ('indeterminate' in item && item.indeterminate) {
			return indeterminateMenuItem;
		}
		if ('targetPub' in item && item.targetPub) {
			const { targetPub } = item;
			return (
				<PubMenuItem
					id={targetPub.id}
					key={targetPub.id}
					title={<PubTitle pubData={targetPub} />}
					contributors={targetPub.attributions?.filter((attr) => attr.isAuthor)}
					image={targetPub.avatar}
					active={modifiers.active}
					onClick={handleClick}
					showImage={true}
				/>
			);
		}
		if (
			'externalPublication' in item &&
			item.externalPublication &&
			item.externalPublication.title
		) {
			const { title, contributors, avatar, id } = item.externalPublication;
			return (
				<PubMenuItem
					key={title}
					id={id}
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
			noResults={
				queryValue ? (
					<MenuItem
						disabled
						className="loading-menu-item"
						text={isLoading ? 'Loading...' : 'No results'}
						icon={isLoading && <Spinner size={16} />}
					/>
				) : null
			}
			// @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
			popoverProps={suggestPopoverProps}
		/>
	);
};
export default NewEdgeInput;
