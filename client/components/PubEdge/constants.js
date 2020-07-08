import PropTypes from 'prop-types';

export const pubEdgeType = PropTypes.shape({
	externalPublication: PropTypes.shape({
		title: PropTypes.string.isRequired,
		url: PropTypes.string.isRequired,
		contributors: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.arrayOf(
				PropTypes.oneOfType([
					PropTypes.shape({
						name: PropTypes.string,
					}),
					PropTypes.string,
				]),
			),
		]),
		doi: PropTypes.string,
		description: PropTypes.string,
		avatar: PropTypes.string,
		publicationDate: PropTypes.string,
	}),
	targetPub: PropTypes.shape({
		title: PropTypes.string,
		id: PropTypes.string,
	}),
	relationType: PropTypes.string.isRequired,
	pubIsParent: PropTypes.bool.isRequired,
});
