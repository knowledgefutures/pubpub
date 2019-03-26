import PropTypes from 'prop-types';

export default PropTypes.shape({
	pages: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, title: PropTypes.string })),
});
