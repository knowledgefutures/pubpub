/**
 * Renders a list of contributors
 */

const roleList = {
	'Writing – Review & Editing': 'editor',
	Editor: 'editor',
	'Series Editor': 'editor',
	Translator: 'translator',
	Chair: 'chair',
};

const checkRole = (attribution) => {
	return roleList[attribution.roles?.[0]] ?? 'author';
};

export default (attributions) => {
	if (attributions.length === 0) {
		return {};
	}
	return {
		contributors: {
			person_name: attributions.map((attribution, attributionIndex) => {
				const personNameOutput = {
					'@contributor_role': attribution.isAuthor ? checkRole(attribution) : 'reader',
					'@sequence': attributionIndex === 0 ? 'first' : 'additional',
					given_name: attribution.user.lastName ? attribution.user.firstName : '',
					surname: attribution.user.lastName
						? attribution.user.lastName
						: attribution.user.firstName,
					affiliation: attribution.affiliation,
					ORCID: `https://orcid.org/${attribution.user.orcid}`,
				};
				if (!personNameOutput.affiliation) {
					delete personNameOutput.affiliation;
				}
				if (!personNameOutput.given_name) {
					delete personNameOutput.given_name;
				}
				if (!attribution.user.orcid) {
					delete personNameOutput.ORCID;
				}
				return personNameOutput;
			}),
		},
	};
};
