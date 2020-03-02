import PropTypes from 'prop-types';

export default PropTypes.shape({
	id: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	isRestricted: PropTypes.bool.isRequired,
	isPublic: PropTypes.bool.isRequired,
	pageId: PropTypes.string.isRequired,
	metadata: PropTypes.object,
});
