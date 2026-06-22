import type { EditorChangeObject } from 'components/Editor';
import type { LoginData, Maybe } from 'types';

import { useIdlyUpdatedState } from 'client/utils/useIdlyUpdatedState';
import { getRandomColor } from 'utils/colors';
import { usePageContext } from 'utils/hooks';

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

export const usePubCollabState = () => {
	const {
		loginData,
		scopeData: {
			activePermissions: { canEdit, canEditDraft },
		},
	} = usePageContext();

	const [collabState, updateCollabState] = useIdlyUpdatedState<PubCollabState>(() => {
		return {
			editorChangeObject: {} as unknown as null,
			status: 'connecting',
			localCollabUser: getLocalCollabUser(canEdit || canEditDraft, loginData),
			remoteCollabUsers: [],
		};
	});

	return [collabState, updateCollabState] as const;
};
