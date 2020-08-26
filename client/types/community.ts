import PropTypes from 'prop-types';

type community = {
    pages?: {
        id?: string;
        title?: string;
    }[];
};
// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type '{ id?: stri... Remove this comment to see the full error message
const community: PropTypes.Requireable<community> = PropTypes.shape({
    pages: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, title: PropTypes.string })),
});
export default community;
