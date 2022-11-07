import { useCallback, useEffect } from 'react';
import firebase from 'firebase';

import { LoginData, Maybe, PubPageData } from 'types';
import { getRandomColor } from 'utils/colors';
import { usePageContext } from 'utils/hooks';
import { EditorChangeObject } from 'components/Editor';
import { initFirebase } from 'client/utils/firebaseClient';
import { useIdlyUpdatedState } from 'client/utils/useIdlyUpdatedState';

type CollabUser = {
	id: null | string;
	backgroundColor: string;
	cursorColor: string;
	image: Maybe<string>;
	name: string;
	initials: string;
	canEdit: boolean;
};

export type PubCollabStatus = 'connecting' | 'connected' | 'saving' | 'saved' | 'disconnected';

export type PubCollabState = {
	editorChangeObject: null | EditorChangeObject;
	status: PubCollabStatus;
	localCollabUser: CollabUser;
	remoteCollabUsers: CollabUser[];
	firebaseDraftRef: null | firebase.database.Reference;
};

type Options = {
	pubData: PubPageData;
};

const getLocalCollabUser = (canEdit: boolean, loginData: LoginData) => {
	const userColor = getRandomColor(loginData.id);
	return {
		id: loginData.id,
		backgroundColor: `rgba(${userColor}, 0.2)`,
		cursorColor: `rgba(${userColor}, 1.0)`,
		image: loginData.avatar || null,
		name: loginData.fullName || 'Anonymous',
		initials: loginData.initials || '?',
		canEdit,
	};
};

export const usePubCollabState = (options: Options) => {
	const { pubData } = options;
	const { draft, firebaseToken } = pubData;
	const {
		loginData,
		scopeData: {
			activePermissions: { canEdit, canEditDraft },
		},
	} = usePageContext();

	const [collabState, updateCollabState] = useIdlyUpdatedState<PubCollabState>(() => {
		return {
			// TODO(ian): Verify that there are no unchecked property accesses on this
			// editorChangeObject and then remove this cast.
			editorChangeObject: {} as unknown as null,
			status: 'connecting',
			localCollabUser: getLocalCollabUser(canEdit || canEditDraft, loginData),
			remoteCollabUsers: [],
			firebaseDraftRef: null,
		};
	});

	const syncRemoteCollabUsers = useCallback(
		(snapshot: firebase.database.DataSnapshot) => {
			const users = snapshot.val() as null | CollabUser[];
			if (users) {
				const remoteCollabUsers = Object.values(users).filter(
					(user: any) => user.id !== loginData.id,
				);
				updateCollabState({ remoteCollabUsers });
			}
		},
		[updateCollabState, loginData],
	);

	useEffect(() => {
		if (draft && firebaseToken) {
			initFirebase(draft.firebasePath, firebaseToken).then((firebaseDraftRef) => {
				if (!firebaseDraftRef) {
					return;
				}
				updateCollabState({ firebaseDraftRef });
				firebaseDraftRef?.child('cursors').on('value', syncRemoteCollabUsers);
			});
		}
	}, [draft, firebaseToken, updateCollabState, syncRemoteCollabUsers]);

	return [collabState, updateCollabState] as const;
};
