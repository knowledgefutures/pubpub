// Some overrides for specific communities.
// TODO(ian): Handle this with the database instead.
const PUBPUB_DOI_PREFIX = '10.21428';
const MITP_DOI_PREFIX = '10.1162';
const IASTATE_DOI_PREFIX = '10.31274';
const AAS_DOI_PREFIX = '10.3847';
const MEDIASTUDIES_DOI_PREFIX = '10.32376';
const RS_DOI_PREFIX = '10.46470';

export const communityDoiOverrides = [
	{
		communityIds: [
			'99608f92-d70f-46c1-a72c-df272215f13e', // HDSR
			'00c13b77-f067-4b53-8f11-c97aa4b024ff', // Projections
			'ba67f642-710c-4dec-a683-471946cc5783', // WIP
		],
		prefix: MITP_DOI_PREFIX,
		key: 'MITP',
	},
	{
		communityIds: [
			'3d9ea6a4-25b9-42d3-8ceb-22459c649096', // SUS-RURI
		],
		prefix: IASTATE_DOI_PREFIX,
		key: 'IASTATE',
	},
	{
		communityIds: [
			'25c2cfeb-dc5b-4dd7-9c82-19146688a931', // Bulletin of the AAS
		],
		prefix: AAS_DOI_PREFIX,
		key: 'AAS',
	},
	{
		communityIds: [
			'3f8575cb-cdf7-48bb-8985-f4eee1b6c624', // mediastudies.press
			'd895a0ea-f471-4730-9c4a-3d5de1733ccb', // History of Media Studies
		],
		prefix: MEDIASTUDIES_DOI_PREFIX,
		key: 'MEDIASTUDIES',
	},
	{
		communityIds: [
			'03d8ffbd-bc68-45ce-b453-6f10b8ca3476', // https://rs-ojict.pubpub.org/
		],
		prefix: RS_DOI_PREFIX,
		key: 'RS',
	},
];

export const getDoiOverrideByCommunityId = (communityId) => {
	return communityDoiOverrides.find((override) =>
		override.communityIds.some((id) => id === communityId),
	);
};

export const choosePrefixByCommunityId = (communityId) => {
	const matchingOverride = getDoiOverrideByCommunityId(communityId);
	if (matchingOverride) {
		return matchingOverride.prefix;
	}
	return PUBPUB_DOI_PREFIX;
};
