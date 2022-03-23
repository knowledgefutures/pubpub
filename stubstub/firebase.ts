import uuid from 'uuid/v4';

import { getPubDraftRef, getDatabaseRef, editFirebaseDraftByRef } from 'server/utils/firebaseAdmin';

const stubstubClientId = 'stubstub-firebase';

export const editFirebaseDraft = (refKey: string = uuid()) => {
	return editFirebaseDraftByRef(getDatabaseRef(refKey)!, stubstubClientId);
};

export const editPub = async (pubId: string) => {
	const draftRef = await getPubDraftRef(pubId);
	return editFirebaseDraftByRef(draftRef, stubstubClientId);
};
