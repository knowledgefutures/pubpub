import { useMemo, useState } from 'react';

import { NoteManager } from 'client/utils/notes';
import { InitialData, Page, PageContext } from 'types';
import { getDashboardMenuState } from 'client/utils/navigation';

// viewData contains container-specific props that we usually shouldn't peek at when doing
// operations that could occur inside _any_ container -- but sometimes we cheat. This type
// defines the possible values we might check for there.
type PossibleViewData = {
	pageData: Page;
};

export const usePageState = (initialData: InitialData, viewData: PossibleViewData): PageContext => {
	const {
		loginData: initialLoginData,
		communityData: initialCommunityData,
		locationData: initialLocationData,
		scopeData: initialScopeData,
		featureFlags,
		initialNotificationsData,
		dismissedUserDismissables,
	} = initialData;
	const { pageData: initialPageData } = viewData;
	const [loginData] = useState(initialLoginData);
	const [locationData] = useState(initialLocationData);
	const [pageData] = useState(initialPageData);
	const [communityData, setCommunityData] = useState(initialCommunityData);
	const [scopeData, setScopeData] = useState(initialScopeData);
	const [noteManager] = useState(() => new NoteManager('apa-7', 'count', {}));

	const updateCommunity = (next) => {
		if (typeof next === 'function') {
			// eslint-disable-next-line no-param-reassign
			next = next(communityData);
		}
		setCommunityData((current) => ({ ...current, ...next }));
	};

	const updateCollection = (next) => {
		const { activeCollection } = scopeData.elements;
		if (activeCollection) {
			if (typeof next === 'function') {
				// eslint-disable-next-line no-param-reassign
				next = next(activeCollection);
			}
			const nextCollection = {
				...activeCollection,
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

	const dashboardMenu = useMemo(
		() => getDashboardMenuState({ scopeData, locationData, featureFlags }),
		[scopeData, locationData, featureFlags],
	);

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
		initialNotificationsData,
		dashboardMenu,
		dismissedUserDismissables,
	};
};
