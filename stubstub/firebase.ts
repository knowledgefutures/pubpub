import { editDraft, getPubDraft } from 'server/utils/firebaseAdmin';

const stubstubClientId = 'stubstub-firebase';

export const editFirebaseDraft = (_refKey?: string) => {
	throw new Error('editFirebaseDraft is deprecated. Use editPub instead.');
};

export const editPub = async (pubId: string) => {
	return editDraft(pubId, stubstubClientId);
};
