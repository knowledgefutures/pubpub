import PropTypes from 'prop-types';

export const communityDataProps = PropTypes.shape({
	accentColorLight: PropTypes.string.isRequired,
	accentColorDark: PropTypes.string.isRequired,
	admins: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	avatar: PropTypes.string,
	collections: PropTypes.arrayOf(PropTypes.shape({})),
	description: PropTypes.string,
	domain: PropTypes.string,
	favicon: PropTypes.string,
	navigation: PropTypes.arrayOf(PropTypes.any).isRequired,
	id: PropTypes.string.isRequired,
	subdomain: PropTypes.string,
	title: PropTypes.string.isRequired,
});

export const loginDataProps = PropTypes.shape({
	avatar: PropTypes.string,
	id: PropTypes.string,
	initials: PropTypes.string,
	isAdmin: PropTypes.bool,
	fullName: PropTypes.string,
	slug: PropTypes.string,
});

export const locationDataProps = PropTypes.shape({
	hostname: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	params: PropTypes.shape({}).isRequired,
	query: PropTypes.shape({}).isRequired,
	queryString: PropTypes.string.isRequired,
	isBasePubPub: PropTypes.bool.isRequired,
});
