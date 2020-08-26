import PropTypes from 'prop-types';

type communityDataProps = {
    accentColorLight: string;
    accentColorDark: string;
    admins: {}[];
    avatar?: string;
    collections?: {}[];
    description?: string;
    domain?: string;
    favicon?: string;
    navigation: any[];
    id: string;
    subdomain?: string;
    title: string;
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type '{}'.
const communityDataProps: PropTypes.Requireable<communityDataProps> = PropTypes.shape({
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
export { communityDataProps };

type loginDataProps = {
    avatar?: string;
    id?: string;
    initials?: string;
    isAdmin?: boolean;
    fullName?: string;
    slug?: string;
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
const loginDataProps: PropTypes.Requireable<loginDataProps> = PropTypes.shape({
    avatar: PropTypes.string,
    id: PropTypes.string,
    initials: PropTypes.string,
    isAdmin: PropTypes.bool,
    fullName: PropTypes.string,
    slug: PropTypes.string,
});
export { loginDataProps };

type locationDataProps = {
    hostname: string;
    path: string;
    params: {};
    query: {};
    queryString: string;
    isBasePubPub: boolean;
};

const locationDataProps: PropTypes.Requireable<locationDataProps> = PropTypes.shape({
    hostname: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    params: PropTypes.shape({}).isRequired,
    query: PropTypes.shape({}).isRequired,
    queryString: PropTypes.string.isRequired,
    isBasePubPub: PropTypes.bool.isRequired,
});
export { locationDataProps };
