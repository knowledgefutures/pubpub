const communitiesWithCustomScriptEnabled = [
	'6ffd8432-b3c1-4094-8ee1-a9de2e72cc27', // Commonplace
	'eb361ef0-d557-4cac-a949-8bd196e096e7', // Staging-place
	'e164d5cb-585e-4170-bad8-10d09e08d1bc', // Contours
	'0417b0c0-cd38-48bd-8a84-b0b95da98813', // Demo
	'36a3e2c8-74ed-417f-b616-4b57b85b9338', // digitalpubsummit
	'2a12f668-ff6b-4403-aec7-d7438e5f9fb4', // elife-container
];

export const communityCanUseCustomScripts = (communityId: string) => {
	return communitiesWithCustomScriptEnabled.includes(communityId);
};
