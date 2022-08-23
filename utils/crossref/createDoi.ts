import { Collection, Community, DepositTarget, Pub } from 'types';

import { PUBPUB_DOI_PREFIX } from './communities';

const getFirstUuidComponent = (id: string) => id.split('-')[0];

export const createComponentDoi = (parentPub: Pub, childPub: Pub) => {
	return `${parentPub.doi}/${getFirstUuidComponent(childPub.id)}`;
};

export default (community: Community, target?: Pub | Collection, depositTarget?: DepositTarget) => {
	const communityDoiPart = getFirstUuidComponent(community.id);
	const targetDoiPart = target ? `.${getFirstUuidComponent(target.id)}` : '';
	const doiSuffix = communityDoiPart + targetDoiPart;

	return `${depositTarget?.doiPrefix ?? PUBPUB_DOI_PREFIX}/${doiSuffix}`;
};
