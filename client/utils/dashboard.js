export const getDashUrl = ({ collectionSlug, pubSlug, mode, subMode }) => {
	let baseHref = '/dash';
	if (collectionSlug) {
		baseHref = `/dash/collection/${collectionSlug}`;
	}
	if (pubSlug) {
		baseHref = `/dash/pub/${pubSlug}`;
	}

	let baseQuery = '';
	if (collectionSlug && pubSlug) {
		baseQuery = `?collectionSlug=${collectionSlug}`;
	}

	const modeString = mode ? `/${mode.toLowerCase().replace(/ /gi, '-')}` : '';
	const subModeString = subMode
		? `/${String(subMode)
				.toLowerCase()
				.replace(/ /gi, '-')}`
		: '';

	return `${baseHref}${modeString}${subModeString}${baseQuery}`;
};

export const groupPubs = ({ pubs, collections }) => {
	const groupedCollections = {};
	const basePubs = [];
	pubs.forEach((pub) => {
		if (!pub.collectionPubs.length) {
			basePubs.push(pub);
		} else {
			pub.collectionPubs.forEach((collectionPub) => {
				const groupedCollectionPubs = groupedCollections[collectionPub.collectionId] || [];
				groupedCollections[collectionPub.collectionId] = [...groupedCollectionPubs, pub];
			});
		}
	});
	return {
		collections: collections.map((collection) => {
			return { ...collection, pubs: groupedCollections[collection.id] || [] };
		}),
		pubs: basePubs,
	};
};

export const getDashboardModes = (locationData) => {
	const activeSubMode = locationData.params.subMode;
	const activeModeSlice = activeSubMode ? -2 : -1;
	const activeMode = locationData.path.split('/').slice(activeModeSlice)[0];
	if (locationData.params.reviewNumber) {
		return { mode: 'reviews', subMode: locationData.params.reviewNumber };
	}
	return {
		mode: activeMode,
		subMode: activeSubMode,
	};
};
