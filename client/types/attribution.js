import PropTypes from 'prop-types';

export default PropTypes.shape({
	id: PropTypes.string.isRequired,
	isAuthor: PropTypes.bool.isRequired,
	roles: PropTypes.arrayOf(PropTypes.string),
	user: PropTypes.shape({
		initials: PropTypes.string,
		avatar: PropTypes.string,
		fullName: PropTypes.string,
		slug: PropTypes.string,
	}).isRequired,
});
