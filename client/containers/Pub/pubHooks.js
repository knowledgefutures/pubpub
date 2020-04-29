import { useContext } from 'react';
import { PubContext } from './PubSyncManager';

export const usePubContext = () => {
	return useContext(PubContext);
};

export const useCollab = () => {
	const { collabData } = useContext(PubContext);
	return collabData;
};

export const usePubHistory = () => {
	const { historyData } = useContext(PubContext);
	return historyData;
};

export const usePubData = () => {
	const { pubData } = useContext(PubContext);
	return pubData;
};
