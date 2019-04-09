const PUBPUB_DOI_PREFIX = '10.21428';

const withPubPubDoiPrefix = (component) => `${PUBPUB_DOI_PREFIX}/${component}`;

const splitId = (item) => item.id.split('-')[0];

export const makeComponentId = (community, collection, pub) =>
	[community && splitId(community), collection && splitId(collection), pub && splitId(pub)]
		.map((result) => result || 'none')
		.join('-');

export default ({ community, target, version }) => {
	const communityPart = splitId(community);
	const targetPart = target ? `.${splitId(target)}` : '';
	const versionPart = version ? `/${splitId(version)}` : '';
	return withPubPubDoiPrefix(communityPart + targetPart + versionPart);
};
