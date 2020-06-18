/**
 * Renders a doi_data
 */
export default (doi, timestamp, resource) => {
	if (!doi) {
		return {};
	}
	return {
		doi_data: {
			doi: doi,
			timestamp: timestamp,
			resource: resource,
		},
	};
};
