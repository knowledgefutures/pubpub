import PropTypes from 'prop-types';

export const pubDataProps = PropTypes.shape({
	slug: PropTypes.string.isRequired,
	isManager: PropTypes.bool.isRequired,
	mode: PropTypes.string.isRequired,
});

export const collabDataProps = PropTypes.shape({
	editorChangeObject: PropTypes.object,
	activeClients: PropTypes.array,
	status: PropTypes.string,
});
