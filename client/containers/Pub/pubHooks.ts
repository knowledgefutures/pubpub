import { useContext } from 'react';

import { ImmediatePubContext, SuspendedPubContext } from './PubContextProvider';

export const usePubContext = (options?: { immediate: boolean }) => {
	const { immediate = false } = options ?? {};
	return useContext(immediate ? ImmediatePubContext : SuspendedPubContext);
};

export const useCollab = () => {
	const { collabData } = usePubContext();
	return collabData;
};

export const usePubHistory = () => {
	const { historyData } = usePubContext();
	return historyData;
};

export const usePubData = () => {
	const { pubData } = usePubContext();
	return pubData;
};
