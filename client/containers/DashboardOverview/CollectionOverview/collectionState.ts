import { useMemo, useState } from 'react';

import { CollectionPub, Pub, Collection, Community, DefinitelyHas, SlugStatus, Maybe } from 'types';
import { findRankInRankedList, sortByRank } from 'utils/rank';
import { usePendingChanges, usePageContext } from 'utils/hooks';
import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { usePersistableState } from 'client/utils/usePersistableState';
import * as api from 'client/utils/collections/api';
import { addScopeSummaries, subtractScopeSummaries } from 'utils/scopeSummaries';

const linkCollection = <C extends Collection>(collection: C, community: Community) => {
	const page = community.pages?.find((pg) => pg.id === collection.pageId);
	const attributions = collection.attributions?.map(ensureUserForAttribution);
	return { ...collection, page, attributions };
};

type UseCollectionPubsOptions = {
	collection: DefinitelyHas<Collection, 'scopeSummary'>;
	initialCollectionPubs: CollectionPub[];
	pubs: Pub[];
};

export const useCollectionPubs = (options: UseCollectionPubsOptions) => {
	const { collection, pubs, initialCollectionPubs } = options;
	const { id: collectionId } = collection;
	const {
		communityData: { id: communityId },
	} = usePageContext();
	const { pendingPromise } = usePendingChanges();
	const [collectionPubs, setCollectionPubs] = useState(() => sortByRank(initialCollectionPubs));
	const [scopeSummary, setScopeSummary] = useState(collection.scopeSummary);

	const reorderCollectionPubs = (sourceIndex: number, destinationIndex: number) => {
		const nextCollectionPubs = [...collectionPubs];
		const [removed] = nextCollectionPubs.splice(sourceIndex, 1);
		const newRank = findRankInRankedList(nextCollectionPubs, destinationIndex);
		const updatedValue = {
			...removed,
			rank: newRank,
		};
		nextCollectionPubs.splice(destinationIndex, 0, updatedValue);
		pendingPromise(
			api.updateCollectionPub({
				communityId,
				id: updatedValue.id,
				update: { rank: newRank },
			}),
		);
		setCollectionPubs(nextCollectionPubs);
	};

	const updateCollectionPub = (collectionPub: CollectionPub) => {
		setCollectionPubs(
			collectionPubs.map((cp) => {
				if (cp.id === collectionPub.id) {
					return collectionPub;
				}
				return cp;
			}),
		);
	};

	const removeCollectionPub = (collectionPub: CollectionPub) => {
		const removedPub = pubs.find((p) => p.id === collectionPub.pubId);
		if (removedPub) {
			setScopeSummary((current) => ({
				...subtractScopeSummaries(current, removedPub.scopeSummary),
				pubs: current.pubs - 1,
			}));
		}
		pendingPromise(
			api.removeCollectionPub({
				communityId,
				id: collectionPub.id,
			}),
		);
		setCollectionPubs(collectionPubs.filter((cp) => cp.id !== collectionPub.id));
	};

	const setCollectionPubContextHint = (
		collectionPub: CollectionPub,
		contextHint: null | string,
	) => {
		pendingPromise(
			api.updateCollectionPub({
				communityId,
				id: collectionPub.id,
				update: { contextHint },
			}),
		);
		updateCollectionPub({ ...collectionPub, contextHint });
	};

	const setCollectionPubIsPrimary = (collectionPub: CollectionPub) => {
		const { pubId } = collectionPub;
		const pub = pubs.find((p) => p.id === pubId);
		if (pub && pub.collectionPubs) {
			const newPubRank = findRankInRankedList(pub.collectionPubs, 0, 'pubRank');
			pendingPromise(
				api.updateCollectionPub({
					communityId,
					id: collectionPub.id,
					update: { pubRank: newPubRank },
				}),
			);
			updateCollectionPub({ ...collectionPub, pubRank: newPubRank });
		}
	};

	const addCollectionPub = (pub: Pub) => {
		pendingPromise(
			api
				.addCollectionPub({
					collectionId,
					communityId,
					pubId: pub.id,
				})
				.then((collectionPub) => {
					setScopeSummary((current) => ({
						...addScopeSummaries(current, pub.scopeSummary),
						pubs: current.pubs + 1,
					}));
					setCollectionPubs((newestCollectionPubs) =>
						sortByRank([...newestCollectionPubs, collectionPub]),
					);
				}),
		);
	};

	return {
		addCollectionPub,
		collectionPubs,
		removeCollectionPub,
		reorderCollectionPubs,
		setCollectionPubContextHint,
		setCollectionPubIsPrimary,
		scopeSummary,
	};
};

const getSlugStatus = (error: Maybe<Record<string, any>>, currentSlug: string): SlugStatus => {
	if (error && error.desiredSlug === currentSlug && error.type === 'forbidden-slug') {
		return error.slugStatus;
	}
	return 'available';
};

export const useCollectionState = <C extends Collection>(
	initialCollection: C,
	persistOnUpdate = false,
) => {
	const { updateCollection: updateCollectionGlobally, communityData } = usePageContext();
	const { pendingPromise } = usePendingChanges();

	const { state, error, update, hasChanges, persist } = usePersistableState(
		initialCollection,
		(partialCollection) =>
			pendingPromise(
				api.updateCollection({
					communityId: communityData.id,
					collectionId: initialCollection.id,
					updatedCollection: partialCollection,
				}),
			).then(() => updateCollectionGlobally(partialCollection)),
	);

	const collection = useMemo(() => linkCollection(state, communityData), [state, communityData]);
	const slugStatus: SlugStatus = getSlugStatus(error, state.slug);

	const updateCollection = (next) => update(next, persistOnUpdate);

	const deleteCollection = () =>
		pendingPromise(
			api.deleteCollection({
				communityId: communityData.id,
				collectionId: collection.id,
			}),
		);

	return {
		slugStatus,
		collection,
		hasChanges,
		persistCollection: persist,
		updateCollection,
		deleteCollection,
	};
};
