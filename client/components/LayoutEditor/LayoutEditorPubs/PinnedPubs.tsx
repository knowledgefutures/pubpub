import React, { useState, useRef, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

import { OrderPicker, PubMenuItem } from 'components';
import { Pub } from 'utils/types';
import { useManyPubs } from 'client/utils/useManyPubs/useManyPubs';
import { indexByProperty, unique } from 'utils/arrays';

type Props = {
	pubIds: string[];
	pubsInBlock: Pub[];
	onPubIds: (nextPubIds: string[]) => unknown;
	scopedCollectionId?: string;
};

const useSelectedAvailableState = (
	pubIds: string[],
	pubsInBlock: Pub[],
	loadedPubs: Pub[],
	searchTerm: string,
) => {
	const allPubsByIdRef = useRef<Record<string, Pub>>({});

	return useMemo(() => {
		allPubsByIdRef.current = {
			...allPubsByIdRef.current,
			...indexByProperty([...pubsInBlock, ...loadedPubs], 'id'),
		};

		const { current: allPubsById } = allPubsByIdRef;
		const unselectedLoadedPubs = loadedPubs.filter((pub) => !pubIds.includes(pub.id));

		const selectedPubs = pubIds.map((id) => allPubsById[id]).filter((x) => x);
		let availablePubs: Pub[];

		if (searchTerm) {
			availablePubs = unselectedLoadedPubs;
		} else {
			availablePubs = unique(
				[...pubsInBlock.filter((pub) => !pubIds.includes(pub.id)), ...unselectedLoadedPubs],
				(pub) => pub.id,
			);
		}

		return { selectedPubs, availablePubs };
	}, [pubIds, pubsInBlock, loadedPubs, searchTerm]);
};

const PinnedPubs = (props: Props) => {
	const { pubIds, pubsInBlock, onPubIds, scopedCollectionId } = props;
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearchTerm] = useDebounce(searchTerm, 200);

	const {
		currentQuery: { pubs: loadedPubs, loadMorePubs, hasLoadedAllPubs },
		allQueries: { isLoading },
	} = useManyPubs({
		query: {
			scopedCollectionId,
			term: debouncedSearchTerm,
			ordering: { field: 'title', direction: 'ASC' },
		},
	});

	const { selectedPubs, availablePubs } = useSelectedAvailableState(
		pubIds,
		pubsInBlock,
		loadedPubs,
		debouncedSearchTerm,
	);

	return (
		<OrderPicker
			selectedItems={selectedPubs}
			availableItems={availablePubs}
			onSelectedItems={(nextPubs) => onPubIds(nextPubs.map((pub) => pub.id))}
			selectedTitle="Pinned Pubs"
			availableTitle="Available Pubs"
			renderItem={(pub, onClick) => (
				<PubMenuItem
					title={pub.title}
					contributors={pub.attributions!}
					onClick={onClick}
					bylineProps={{ truncateAt: 4 }}
				/>
			)}
			searchTerm={searchTerm}
			onSearch={setSearchTerm}
			searchPlaceholder="Search for Pubs"
			onRequestMoreItems={loadMorePubs}
			scrollForMoreItems={!hasLoadedAllPubs}
			isRequestingMoreItems={isLoading}
		/>
	);
};

export default PinnedPubs;
