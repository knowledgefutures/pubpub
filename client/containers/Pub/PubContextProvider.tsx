import React, { useCallback, useMemo } from 'react';

import { NoteManager } from 'client/utils/notes';
import { PatchFn, PubPageData } from 'types';

import { useLazyRef } from 'client/utils/useLazyRef';
import { useFacetsQuery } from 'client/utils/useFacets';
import { IdlePatchFn, useIdlyUpdatedState } from 'client/utils/useIdlyUpdatedState';
import { getPubHeadings, PubHeading } from './PubHeader/headerUtils';
import {
	PubSubmissionState,
	PubSubmissionStatePatchFn,
	usePubSubmissionState,
} from './usePubSubmissionState';
import { usePubCollabState, PubCollabState } from './usePubCollabState';
import { usePubHistoryState } from './usePubHistoryState';
import { PubBodyState, usePubBodyState } from './usePubBodyState';
import { usePubSuspendWhileTyping } from './PubSuspendWhileTyping';

type Props = {
	children: React.ReactNode;
	pubData: PubPageData;
};

type UpdateLocalDataFn = (kind: 'pub', data: any, options?: { isImmediate?: boolean }) => void;

export type PubContextType = {
	inPub: boolean;
	pubData: PubPageData;
	pubBodyState: PubBodyState;
	updatePubData: PatchFn<PubPageData>;
	historyData: ReturnType<typeof usePubHistoryState>;
	collabData: PubCollabState;
	updateCollabData: IdlePatchFn<PubCollabState>;
	submissionState: null | PubSubmissionState;
	updateSubmissionState: PubSubmissionStatePatchFn;
	updateLocalData: UpdateLocalDataFn;
	noteManager: NoteManager;
	pubHeadings: PubHeading[];
};

const shimPubContextProps = {
	inPub: false,
	pubData: {
		slug: '',
		releases: [],
		releaseNumber: 0,
	},
	collabData: { editorChangeObject: {} },
	historyData: {},
	firebaseDraftRef: null,
	updateLocalData: null as any,
	updatePubData: null as any,
	submissionState: {},
	noteManager: new NoteManager('apa-7', 'count', {}),
} as any;

export const SuspendedPubContext = React.createContext<PubContextType>(shimPubContextProps);
export const ImmediatePubContext = React.createContext<PubContextType>(shimPubContextProps);

export const PubContextProvider = (props: Props) => {
	const { children, pubData: initialPubData } = props;
	const [pubData, updatePubData] = useIdlyUpdatedState(initialPubData);
	const [collabData, updateCollabData] = usePubCollabState({ pubData });
	const historyData = usePubHistoryState({
		pubData,
		editorView: collabData.editorChangeObject?.view ?? null,
	});
	const [submissionState, updateSubmissionState] = usePubSubmissionState({
		pubData,
		editorChangeObject: collabData.editorChangeObject,
	});
	const pubBodyState = usePubBodyState({ pubData, collabData, historyData, submissionState });
	const { citationStyle, inlineCitationStyle } = useFacetsQuery((F) => F.CitationStyle, {
		fallback: () => ({ citationStyle: 'apa', inlineCitationStyle: 'count' }),
	});

	const { current: noteManager } = useLazyRef(
		() =>
			new NoteManager(citationStyle, inlineCitationStyle, pubData.initialStructuredCitations),
	);

	const pubHeadings = useMemo(
		() => getPubHeadings(pubData.initialDoc, collabData.editorChangeObject),
		[pubData.initialDoc, collabData.editorChangeObject],
	);

	const updateLocalData: UpdateLocalDataFn = useCallback(
		(kind, data, options = {}) => {
			const { isImmediate } = options;
			if (kind === 'pub') {
				if (isImmediate) {
					updatePubData.immediately(true)(data);
				} else {
					updatePubData(data);
				}
			}
		},
		[updatePubData],
	);

	const pubContext: PubContextType = {
		inPub: true,
		pubData,
		updatePubData,
		collabData,
		updateCollabData,
		historyData,
		submissionState,
		updateSubmissionState,
		noteManager,
		pubBodyState,
		updateLocalData,
		pubHeadings,
	};
	const suspendedPubContext: PubContextType = usePubSuspendWhileTyping(pubContext);

	return (
		<SuspendedPubContext.Provider value={suspendedPubContext}>
			<ImmediatePubContext.Provider value={pubContext}>
				{children}
			</ImmediatePubContext.Provider>
		</SuspendedPubContext.Provider>
	);
};
