/**
 * Renders a component list (useful for indicating the relationship between a pub and its versions)
 */
import date from './helpers/date';
import doiData from './doiData';

export default (sortedVersions, timestamp, getVersionDoi, getResourceUrl) => ({
	component_list: {
		component: sortedVersions.map((version) => {
			const versionDate = new Date(version.createdAt);
			return {
				'@parent_relation': 'isPartOf',
				...date('publication_date', versionDate),
				...doiData(getVersionDoi(version), timestamp, getResourceUrl(version)),
			};
		}),
	},
});
