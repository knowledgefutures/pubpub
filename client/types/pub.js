import PropTypes from 'prop-types';

export const pubDataProps = PropTypes.shape({
	slug: PropTypes.string.isRequired,
	// canManage: PropTypes.bool.isRequired,
	// mode: PropTypes.string.isRequired,
});

export const collabDataProps = PropTypes.shape({
	editorChangeObject: PropTypes.object,
	activeClients: PropTypes.array,
	status: PropTypes.string,
});
