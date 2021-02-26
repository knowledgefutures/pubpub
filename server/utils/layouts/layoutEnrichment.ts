import { issueCreatePubToken } from 'server/pub/tokens';

export const enrichLayoutBlocksWithPubTokens = ({ blocks, initialData, collectionId }) => {
	const { loginData, communityData } = initialData;
	const userId = loginData && loginData.id;
	if (blocks && userId) {
		return blocks.map((block) => {
			const { type, content } = block;
			if (type === 'banner') {
				const { buttonType, defaultCollectionIds } = content;
				const createInCollectionIds = [
					...(defaultCollectionIds || []),
					collectionId,
				].filter((x) => x);
				if (buttonType === 'create-pub') {
					return {
						...block,
						content: {
							...content,
							createPubToken: issueCreatePubToken({
								userId,
								communityId: communityData.id,
								createInCollectionIds,
							}),
						},
					};
				}
			}
			return block;
		});
	}
	return blocks;
};

export const enrichCollectionWithPubTokens = (collection, initialData) => {
	const { layout, id: collectionId } = collection;
	return {
		...collection,
		layout: {
			...layout,
			blocks: enrichLayoutBlocksWithPubTokens({
				blocks: layout.blocks,
				initialData,
				collectionId,
			}),
		},
	};
};
