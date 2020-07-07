import PropTypes from 'prop-types';

export const pubEdgeType = PropTypes.shape({
	title: PropTypes.string.isRequired,
	url: PropTypes.string.isRequired,
	byline: PropTypes.string,
	doi: PropTypes.string,
	description: PropTypes.string,
	avatar: PropTypes.string,
	publicationDate: PropTypes.number,
	relationType: PropTypes.string.isRequired,
	pubIsParent: PropTypes.bool.isRequired,
});

export const RelationType = {
	Discussion: 'discussion',
	Review: 'review',
};
