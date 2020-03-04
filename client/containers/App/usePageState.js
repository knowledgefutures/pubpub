import { useState } from 'react';

export const usePageState = ({
	loginData: initialLoginData,
	communityData: initialCommunityData,
	locationData: initialLocationData,
	scopeData: initialScopeData,
}) => {
	const [loginData] = useState(initialLoginData);
	const [locationData] = useState(initialLocationData);
	const [communityData, setCommunityData] = useState(initialCommunityData);
	const [scopeData, setScopeData] = useState(initialScopeData);

	const updateCommunity = (next) => {
		if (typeof next === 'function') {
			// eslint-disable-next-line no-param-reassign
			next = next(communityData);
		}
		setCommunityData((current) => ({ ...current, ...next }));
		if (scopeData.elements.activeCommunity) {
			const nextCommunity = {
				...scopeData.elements.activeCommunity,
				...next,
			};
			setScopeData((current) => {
				return {
					...current,
					elements: {
						...scopeData.elements,
						activeCommunity: nextCommunity,
					},
				};
			});
		}
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
		loginData: loginData,
		locationData: locationData,
		communityData: communityData,
		scopeData: scopeData,
		updateCommunity: updateCommunity,
		updateCollection: updateCollection,
	};
};
