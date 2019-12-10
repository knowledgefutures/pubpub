export const getDashUrl = ({ collectionSlug, pubSlug, mode, submode }) => {
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
	const submodeString = submode ? `/${submode.toLowerCase().replace(/ /gi, '-')}` : '';

	return `${baseHref}${modeString}${submodeString}${baseQuery}`;
};

export const groupPubs = (pubs, collections) => {
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

export const getActiveDiscussions = (communityData, locationData) => {
	return [];
	const { collections } = groupPubs(communityData.pubs, communityData.collections);
	const collectionSlug = locationData.params.collectionSlug || locationData.query.collectionSlug;
	const pubSlug = locationData.params.pubSlug;
	const activeCollection = collections.find(
		(collection) => collection.title.toLowerCase().replace(/ /gi, '-') === collectionSlug,
	);
	const activePub = communityData.pubs.find((pub) => pub.slug === pubSlug);

	const activePubDiscussions =
		activePub &&
		activePub.discussions.map((disc) => {
			return { ...disc, pub: { ...activePub, discussions: undefined } };
		});

	const activeCollectionDiscussions =
		activeCollection &&
		activeCollection.pubs.reduce((prev, curr) => {
			const currDiscussions = curr.discussions.map((disc) => {
				return { ...disc, pub: { ...curr, discussions: undefined } };
			});
			return [...prev, ...currDiscussions];
		}, []);

	const activeCommunityDiscussions = communityData.pubs.reduce((prev, curr) => {
		const currDiscussions = curr.discussions.map((disc) => {
			return { ...disc, pub: { ...curr, discussions: undefined } };
		});
		return [...prev, ...currDiscussions];
	}, []);

	// console.log('activePubDiscussions', activePubDiscussions);
	// console.log('activeCollectionDiscussions', activeCollectionDiscussions);
	// console.log('activeCommunityDiscussions', activeCommunityDiscussions);
	let activeDiscussions = activeCommunityDiscussions;
	if (collectionSlug) {
		activeDiscussions = activeCollectionDiscussions;
	}
	if (pubSlug) {
		activeDiscussions = activePubDiscussions;
	}
	return activeDiscussions;
};
