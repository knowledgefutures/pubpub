import ensureUserForAttribution from 'shared/util/ensureUserForAttribution';

export default (attributions) => {
	return attributions.map(ensureUserForAttribution).sort((a, b) => a.order - b.order);
};
