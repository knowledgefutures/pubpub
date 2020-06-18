export const generateRenderLists = (layout, pubs) => {
	/* Sort pubs by activeBranch date */
	const allPubs = pubs.sort((foo, bar) => {
		// const fooDate = foo.activeBranch.firstKeyAt || foo.createdAt;
		// const barDate = bar.activeBranch.firstKeyAt || bar.createdAt;
		// TODO: Does this still sort newest properly. May have to implement release dates
		const fooDate = foo.createdAt;
		const barDate = bar.createdAt;
		if (fooDate < barDate) {
			return 1;
		}
		if (fooDate > barDate) {
			return -1;
		}
		return 0;
	});

	/* nonSpecifiedPubs is used to keep track of which pubs should flow */
	/* when looking to fill a slot that has not been specifically */
	/* assigned to a given pub */
	let nonSpecifiedPubs = [...allPubs];

	/* Iterate over each block and remove specified pubs from the */
	/* list of nonSpecifiedPubs. */
	layout.forEach((block) => {
		if (block.type === 'pubs') {
			const specifiedPubs = block.content.pubIds;
			nonSpecifiedPubs = nonSpecifiedPubs.filter((pub) => {
				return specifiedPubs.indexOf(pub.id) === -1;
			});
		}
	});

	/* pubRenderLists holds the list of pubs to be rendered in each block */
	const pubRenderLists = {};

	/* Iterate over each block and generate the renderList for that block */
	layout.forEach((block, index) => {
		if (block.type === 'pubs') {
			const allPubIds = {};
			pubs.forEach((curr) => {
				allPubIds[curr.id] = curr;
			});
			const collectionIds = block.content.collectionIds || [];
			// console.log(collectionIds);
			const availablePubs = nonSpecifiedPubs
				.filter((pub) => {
					if (!collectionIds.length) {
						return true;
					}
					return pub.collectionPubs.reduce((prev, curr) => {
						// if (curr.collectionId === block.content.collectionId) { return true; }
						if (collectionIds.indexOf(curr.collectionId) > -1) {
							return true;
						}
						return prev;
					}, false);
				})
				.sort((foo, bar) => {
					const fooRank =
						(foo.collectionPubs &&
							foo.collectionPubs[0] &&
							foo.collectionPubs[0].rank) ||
						'';
					const barRank =
						(bar.collectionPubs &&
							bar.collectionPubs[0] &&
							bar.collectionPubs[0].rank) ||
						'';

					if (fooRank < barRank) {
						return -1;
					}
					if (fooRank > barRank) {
						return 1;
					}
					if (foo.createdAt > bar.createdAt) {
						return -1;
					}
					if (foo.createdAt < bar.createdAt) {
						return 1;
					}
					return 0;
				});

			/* First add the specified pubs for a given block to the renderList */
			const renderList = block.content.pubIds.map((id) => {
				return allPubIds[id];
			});

			/* While below the set limit of max available pubs */
			/* keep adding pubs to the renderList */
			const maxAvailableList = availablePubs.length + renderList.length;
			const limit = Math.min(maxAvailableList, block.content.limit || maxAvailableList);
			for (let pubIndex = renderList.length; pubIndex < limit; pubIndex += 1) {
				renderList.push(availablePubs[0]);
				nonSpecifiedPubs = nonSpecifiedPubs.filter((pub) => {
					return pub.id !== availablePubs[0].id;
				});
				availablePubs.splice(0, 1);
			}

			/* Filter renderList to remove any undefined (due to specified pubs not in the collection) */
			/* or non-collection pubs. */
			pubRenderLists[index] = renderList.filter((pub) => {
				return pub;
			});
		}
	});
	return pubRenderLists;
};

export const generatePageBackground = (pageTitle) => {
	const gradients = ['#b33939', '#cd6133', '#474787', '#227093', '#218c74'];

	if (!pageTitle) {
		return gradients[0];
	}
	return gradients[pageTitle.charCodeAt(pageTitle.length - 1) % 5];
};

export const getDefaultLayout = () => {
	// if (isPage) {
	// 	return [
	// 		{
	// 			id: 'kruw36cv',
	// 			type: 'text',
	// 			content: {
	// 				text: undefined,
	// 			},
	// 		}
	// 	];
	// }
	return [
		{
			id: '0kyj32ay',
			type: 'pubs',
			content: {
				title: '',
				size: 'large',
				limit: 1,
				pubIds: [],
			},
		},
		{
			id: 'gruw36cv',
			type: 'pubs',
			content: {
				title: '',
				size: 'medium',
				limit: 0,
				pubIds: [],
			},
		},
		// {
		// 	type: pubs
		// 	content: {
		// 		title:
		// 		pubPreviewType:
		// 		limit:
		// 		pubIds:
		// 		draftsOnly:
		// 		collectionId:
		// 	}
		// }
	];
};
