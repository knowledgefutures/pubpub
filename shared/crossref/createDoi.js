const PUBPUB_DOI_PREFIX = '10.21428';
const MITP_DOI_PREFIX = '10.1162';

const withPubPubDoiPrefix = (component) => `${PUBPUB_DOI_PREFIX}/${component}`;
const withMitpPrefix = (component) => `${MITP_DOI_PREFIX}/${component}`;

const splitId = (item) => item.id.split('-')[0];

const choosePrefixerForCommunity = (community) => {
	if (community.id === '99608f92-d70f-46c1-a72c-df272215f13e') {
		return withMitpPrefix;
	}
	return withPubPubDoiPrefix;
};

export const makeComponentId = (community, collection, pub) =>
	[community && splitId(community), collection && splitId(collection), pub && splitId(pub)]
		.map((result) => result || 'none')
		.join('-');

export default ({ community, target }) => {
	const communityPart = splitId(community);
	const targetPart = target ? `.${splitId(target)}` : '';
	return choosePrefixerForCommunity(community)(communityPart + targetPart);
};
