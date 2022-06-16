// Some overrides for specific communities.
// TODO(ian): Handle this with the database instead.
export const PUBPUB_DOI_PREFIX = '10.21428';
const MITP_DOI_PREFIX = '10.1162';
const IASTATE_DOI_PREFIX = '10.31274';
const AAS_DOI_PREFIX = '10.3847';
const MEDIASTUDIES_DOI_PREFIX = '10.32376';
const RS_DOI_PREFIX = '10.46470';
const JOTE_DOI_PREFIX = '10.36850';
const APA_DOI_PREFIX = '10.1037';
const ROCHESTER_DOI_PREFIX = '10.47761';
const OPENPRESSTIU_DOI_PREFIX = '10.26116';
const UGHENT_DOI_PREFIX = '10.21825';
const NCSU_DOI_PREFIX = '10.52750';
const ABRF_DOI_PREFIX = '10.7171';
const LAVAL_DOI_PREFIX = '10.47123';
const FREEMOSCOWU_DOI_PREFIX = '10.55167';
const ARCADIASCIENCE_DOI_PREFIX = '10.57844';

export const managedDoiPrefixes = [
	PUBPUB_DOI_PREFIX,
	MITP_DOI_PREFIX,
	IASTATE_DOI_PREFIX,
	AAS_DOI_PREFIX,
	MEDIASTUDIES_DOI_PREFIX,
	RS_DOI_PREFIX,
	JOTE_DOI_PREFIX,
	APA_DOI_PREFIX,
	ROCHESTER_DOI_PREFIX,
	OPENPRESSTIU_DOI_PREFIX,
	UGHENT_DOI_PREFIX,
	NCSU_DOI_PREFIX,
	ABRF_DOI_PREFIX,
	LAVAL_DOI_PREFIX,
	FREEMOSCOWU_DOI_PREFIX,
	ARCADIASCIENCE_DOI_PREFIX,
];

export const communityDoiOverrides = [
	{
		communityIds: [
			'99608f92-d70f-46c1-a72c-df272215f13e', // HDSR
			'00c13b77-f067-4b53-8f11-c97aa4b024ff', // Projections
			'ba67f642-710c-4dec-a683-471946cc5783', // WIP
			'2e3983f5-6090-4b15-ac21-3d753c77ca39', // RRC19
			'a8667414-71c7-4813-bdd7-162a32e00efc', // Arch Series
		],
		prefix: MITP_DOI_PREFIX,
		key: 'MITP',
	},
	{
		communityIds: [
			'3d9ea6a4-25b9-42d3-8ceb-22459c649096', // SUS-RURI
			'b8136f97-b9c2-442a-95a8-fe1df5c1d209', // OPENISU
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
	{
		communityIds: [
			'27d9a5c8-30f3-44bd-971f-181388d53323', // https://jtrialerror.pubpub.org/
		],
		prefix: JOTE_DOI_PREFIX,
		key: 'JOTE',
	},
	{
		communityIds: [
			'700f6ff1-4acc-4ca4-b740-8d04d89fea9e', // https://tmb.pubpub.org/
			'67edb85b-3e58-44e5-89ef-dded1f72972c', // https://jccwp.pubpub.org/
		],
		prefix: APA_DOI_PREFIX,
		key: 'APA',
	},
	{
		communityIds: [
			'494a02f6-55bd-49b5-b0c3-0c0d98a76444', // https://invisibleculture.pubpub.org/
		],
		prefix: ROCHESTER_DOI_PREFIX,
		key: 'ROCHESTER',
	},
	{
		communityIds: [
			'6ffe5cea-8ff9-421f-83dc-29d7d2eef839', // https://openpresstiu.pubpub.org/
		],
		prefix: OPENPRESSTIU_DOI_PREFIX,
		key: 'OPENPRESSTIU',
	},
	{
		communityIds: [
			'86c49e4a-a4bb-4748-8e01-81d8113deb53', // https://ugent-library.pubpub.org/
		],
		prefix: UGHENT_DOI_PREFIX,
		key: 'UGHENT',
	},
	{
		communityIds: [
			'09eba68b-d4ec-462d-a200-960abb62b384', // https://fermentology.pubpub.org/
			'21ff89b9-b3b0-4d3e-9ba7-46ce5c6ceaf2', // https://ncsu-wolfpack-solutions.pubpub.org/
		],
		prefix: NCSU_DOI_PREFIX,
		key: 'NSCU',
	},
	{
		communityIds: [
			'3fc1f5fe-d4be-419a-9b72-719d9b12169c', // https://jbt.pubpub.org/
		],
		prefix: ABRF_DOI_PREFIX,
		key: 'ABRF',
	},
	{
		communityIds: [
			'f51e9fed-9bfd-465d-8556-65ad9a65f734', // https://codicille.pubpub.org/
		],
		prefix: LAVAL_DOI_PREFIX,
		key: 'LAVAL',
	},
	{
		communityIds: [
			'52333846-c54f-4668-ba45-c3124b226fd3', // https://freewmoscowuniversity.pubpub.org/
		],
		prefix: FREEMOSCOWU_DOI_PREFIX,
		key: 'FREEMOSCOWU',
	},
	{
		communityIds: [
			'1a71ef4d-f6fe-40d3-8379-42fa2141db58', // https://research.arcadiascience.com/
		],
		prefix: ARCADIASCIENCE_DOI_PREFIX,
		key: 'ARCADIASCIENCE',
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
