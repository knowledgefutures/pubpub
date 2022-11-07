import { useCallback, useEffect } from 'react';
import queryString from 'query-string';
import { EditorView } from 'prosemirror-view';

import { PubHistoryState, PubPageData, PubDraftInfo, DocJson } from 'types';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { useIdlyUpdatedState } from 'client/utils/useIdlyUpdatedState';

type Options = {
	pubData: PubPageData;
	editorView: null | EditorView;
};

const loadPubVersionFromHistory = (
	pubId: string,
	historyKey: number,
	accessHash: string,
): Promise<PubDraftInfo> =>
	apiFetch.get(
		'/api/pubHistory?' +
			queryString.stringify({
				pubId,
				historyKey,
				accessHash,
			}),
	);

export const usePubHistoryState = (options: Options) => {
	const { pubData, editorView } = options;
	const { initialDoc } = pubData;
	const {
		locationData: {
			query: { access: accessHash },
		},
	} = usePageContext();

	const [historyState, updateHistoryState] = useIdlyUpdatedState<PubHistoryState>(() => {
		const { historyData } = pubData;
		const isViewingHistory = historyData.currentKey !== historyData.latestKey;
		const latestHistoryDoc = isViewingHistory ? initialDoc : null;
		return {
			...historyData,
			timestamps: {
				[-1]: new Date(pubData.createdAt).valueOf(),
				...historyData.timestamps,
			},
			outstandingRequests: 0,
			latestKeyReceivedAt: null,
			isViewingHistory,
			loadedIntoHistory: isViewingHistory,
			historyDoc: latestHistoryDoc,
			latestHistoryDoc,
			historyDocEditorKey: `history-${historyData.currentKey}`,
		};
	});

	const pubId = pubData.id;
	const { isViewingHistory, currentKey, latestKey } = historyState;

	const setLatestHistoryKey = useCallback(
		(key: number) =>
			updateHistoryState((currentState) => {
				return {
					currentKey: key,
					latestKey: key,
					timestamps: {
						[key]: Date.now(),
						...currentState.timestamps,
					},
				};
			}),
		[updateHistoryState],
	);

	const setCurrentHistoryKey = useCallback(
		(key: number) => updateHistoryState({ currentKey: key }),
		[updateHistoryState],
	);

	const setIsViewingHistory = useCallback(
		(nextIsViewingHistory: boolean) => {
			if (nextIsViewingHistory) {
				const latestHistoryDoc = editorView
					? (editorView.state.doc.toJSON() as DocJson)
					: initialDoc;
				updateHistoryState({
					isViewingHistory: true,
					latestHistoryDoc,
					historyDoc: latestHistoryDoc,
				});
			} else {
				updateHistoryState({ isViewingHistory: false });
			}
		},
		[updateHistoryState, editorView, initialDoc],
	);

	useEffect(() => {
		if (isViewingHistory) {
			if (currentKey === latestKey) {
				updateHistoryState((state) => ({
					historyDoc: state.latestHistoryDoc,
					historyDocEditorKey: `history-${latestKey}`,
				}));
			} else {
				updateHistoryState((state) => {
					return {
						outstandingRequests: state.outstandingRequests + 1,
					};
				});
				loadPubVersionFromHistory(pubId, currentKey, accessHash).then((draftInfo) => {
					const {
						doc,
						historyData: { timestamps },
					} = draftInfo;
					updateHistoryState((state) => {
						const outstandingRequestsUpdate = {
							outstandingRequests: state.outstandingRequests - 1,
						};
						if (state.currentKey === currentKey) {
							return {
								...outstandingRequestsUpdate,
								historyDoc: doc,
								historyDocEditorKey: `history-${currentKey}`,
								timestamps: {
									...state.timestamps,
									...timestamps,
								},
							};
						}
						return outstandingRequestsUpdate;
					});
				});
			}
		}
	}, [isViewingHistory, currentKey, latestKey, accessHash, pubId, updateHistoryState]);

	return {
		...historyState,
		setCurrentHistoryKey,
		setLatestHistoryKey,
		setIsViewingHistory,
	};
};
