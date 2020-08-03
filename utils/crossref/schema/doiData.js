/**
 * Renders a doi_data
 */
export default (doi, timestamp, resource, contentVersion) => {
	if (!doi) {
		return {};
	}
	return {
		doi_data: {
			doi: doi,
			timestamp: timestamp,
			resource: {
				'#text': resource,
				'@content_version': contentVersion,
			},
		},
	};
};
