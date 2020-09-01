import PropTypes from 'prop-types';

type collection = {
	id: string;
	title: string;
	isRestricted: boolean;
	isPublic: boolean;
	pageId: string;
	metadata?: any;
};
const collection: PropTypes.Requireable<collection> = PropTypes.shape({
	id: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	isRestricted: PropTypes.bool.isRequired,
	isPublic: PropTypes.bool.isRequired,
	pageId: PropTypes.string.isRequired,
	metadata: PropTypes.object,
});
export default collection;
