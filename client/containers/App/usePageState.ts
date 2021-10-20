import { useState } from 'react';

import { NoteManager } from 'client/utils/notes';

export const usePageState = (initialData, viewData) => {
	const {
		loginData: initialLoginData,
		communityData: initialCommunityData,
		locationData: initialLocationData,
		scopeData: initialScopeData,
		featureFlags,
	} = initialData;
	const { pageData: initialPageData } = viewData;
	const [loginData] = useState(initialLoginData);
	const [locationData] = useState(initialLocationData);
	const [pageData] = useState(initialPageData);
	const [communityData, setCommunityData] = useState(initialCommunityData);
	const [scopeData, setScopeData] = useState(initialScopeData);
	const [noteManager] = useState(() => new NoteManager('apa', 'count', {}));

	const updateCommunity = (next) => {
		if (typeof next === 'function') {
			// eslint-disable-next-line no-param-reassign
			next = next(communityData);
		}
		setCommunityData((current) => ({ ...current, ...next }));
	};

	const updateCollection = (next) => {
		if (scopeData.elements.activeCollection) {
			const nextCollection = {
				...scopeData.elements.activeCollection,
				...next,
			};
			setScopeData((current) => {
				return {
					...current,
					elements: {
						...scopeData.elements,
						activeCollection: nextCollection,
					},
				};
			});
		}
	};

	return {
		loginData,
		locationData,
		communityData,
		scopeData,
		pageData,
		updateCommunity,
		updateCollection,
		noteManager,
		featureFlags,
	};
};
