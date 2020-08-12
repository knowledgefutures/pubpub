import { choosePrefixByCommunityId } from './communities';

const splitId = (item) => item.id.split('-')[0];

export const createComponentDoi = (parentPub, childPub) => {
	return `${parentPub.doi}/${splitId(childPub)}`;
};

export default ({ community, target }) => {
	const communityPart = splitId(community);
	const targetPart = target ? `.${splitId(target)}` : '';
	const component = communityPart + targetPart;

	return `${choosePrefixByCommunityId(community.id)}/${component}`;
};
