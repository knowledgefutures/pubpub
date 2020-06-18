/**
 * Renders a list of contributors
 */
export default (attributions) => {
	if (attributions.length === 0) {
		return {};
	}
	return {
		contributors: {
			person_name: attributions.map((attribution, attributionIndex) => {
				const personNameOutput = {
					'@contributor_role': attribution.isAuthor ? 'author' : 'reader',
					'@sequence': attributionIndex === 0 ? 'first' : 'additional',
					given_name: attribution.user.lastName ? attribution.user.firstName : '',
					surname: attribution.user.lastName
						? attribution.user.lastName
						: attribution.user.firstName,
					affiliation: attribution.affiliation,
				};
				if (!personNameOutput.affiliation) {
					delete personNameOutput.affiliation;
				}
				if (!personNameOutput.given_name) {
					delete personNameOutput.given_name;
				}
				return personNameOutput;
			}),
		},
	};
};
