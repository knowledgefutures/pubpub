import PropTypes from 'prop-types';

type attribution = {
	id: string;
	isAuthor?: boolean;
	roles?: string[];
	user: {
		id?: string;
		initials?: string;
		avatar?: string;
		fullName?: string;
		slug?: string;
	};
	order: number;
	createdAt: number;
};
// @ts-expect-error ts-migrate(2322) FIXME: Type 'Requireable<InferProps<{ id: Validator<strin... Remove this comment to see the full error message
const attribution: PropTypes.Requireable<attribution> = PropTypes.shape({
	id: PropTypes.string.isRequired,
	isAuthor: PropTypes.bool,
	roles: PropTypes.arrayOf(PropTypes.string),
	user: PropTypes.shape({
		initials: PropTypes.string,
		avatar: PropTypes.string,
		fullName: PropTypes.string,
		slug: PropTypes.string,
	}).isRequired,
});
export default attribution;
