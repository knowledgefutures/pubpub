import { choosePrefixByCommunityId } from './communities';

const splitId = (item) => item.id.split('-')[0];

export const makeComponentId = (community, collection, pub) =>
	[community && splitId(community), collection && splitId(collection), pub && splitId(pub)]
		.map((result) => result || 'none')
		.join('-');

export default ({ community, target }) => {
	const communityPart = splitId(community);
	const targetPart = target ? `.${splitId(target)}` : '';
	const component = communityPart + targetPart;
	return `${choosePrefixByCommunityId(community.id)}/${component}`;
};
