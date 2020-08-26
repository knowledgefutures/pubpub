import PropTypes from 'prop-types';

type pubDataProps = {
    slug: string;
};

const pubDataProps: PropTypes.Requireable<pubDataProps> = PropTypes.shape({
    slug: PropTypes.string.isRequired,
});
export { pubDataProps };

type collabDataProps = {
    editorChangeObject?: any;
    activeClients?: any[];
    status?: string;
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'any[] | und... Remove this comment to see the full error message
const collabDataProps: PropTypes.Requireable<collabDataProps> = PropTypes.shape({
    editorChangeObject: PropTypes.object,
    activeClients: PropTypes.array,
    status: PropTypes.string,
});
export { collabDataProps };
