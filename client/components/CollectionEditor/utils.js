import { getSchemaForKind } from 'shared/collections/schemas';
import findRank from 'shared/util/findRank';

export const createPubSelection = (pub, collection, rank, id = null, contextHintValue = null) => {
	const { contextHints } = getSchemaForKind(collection.kind);
	const contextHint = contextHintValue
		? contextHints.find((ch) => ch.value === contextHintValue)
		: contextHints.find((ch) => ch.default);
	return {
		pub: pub,
		collection: collection,
		rank: rank,
		contextHint: contextHint,
		id: id,
	};
};

// The backend model used to represent these collection editor selections is CollectionPub. We
// abstract away that terminology on the frontend, but it's used here to indicate a function that
// takes raw CollectionPub data from the server and creates a pub selection object that the
// CollectionEditor component understands how to manipulate.
export const createPubSelectionFromCollectionPub = (collectionPub, allPubs, collection) => {
	const { contextHint, rank, id } = collectionPub;
	const pub = allPubs.find((p) => p.id === collectionPub.pubId);
	return createPubSelection(pub, collection, rank, id, contextHint);
};

export const authorsNamesFromPub = (pub) =>
	pub.attributions.map((attr) => attr.name).filter((x) => x);

export const fuzzyMatchPub = (pub, input) => {
	if (input.length === 0) {
		return true;
	}
	const normalize = (s) => s.toLowerCase();
	const normalizedInput = normalize(input);
	const normalizedSources = [pub.title]
		.concat(authorsNamesFromPub(pub))
		.concat(pub.collectionPubs.map((pt) => pt.collection.title))
		.filter((x) => x)
		.map(normalize);
	return normalizedSources.some((source) => source.includes(normalizedInput));
};

export const findRankForSelection = (selections, index) =>
	findRank(selections.map((s) => s.rank), index);
