import PropTypes from 'prop-types';

type externalPublicationType = {
	title: string;
	url: string;
	contributors?:
		| string
		| (
				| {
						name?: string;
				  }
				| string
		  )[];
	doi?: string;
	description?: string;
	avatar?: string;
	publicationDate?: number | string;
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'string | (s... Remove this comment to see the full error message
const externalPublicationType: PropTypes.Requireable<externalPublicationType> = PropTypes.shape({
	title: PropTypes.string.isRequired,
	url: PropTypes.string.isRequired,
	contributors: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.arrayOf(
			PropTypes.oneOfType([
				PropTypes.shape({
					name: PropTypes.string,
				}),
				PropTypes.string,
			]),
		),
	]),
	doi: PropTypes.string,
	description: PropTypes.string,
	avatar: PropTypes.string,
	publicationDate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
});
export { externalPublicationType };

type pubEdgeType = {
	externalPublication?: externalPublicationType;
	targetPub?: {
		title?: string;
		id?: string;
	};
	relationType: string;
	pubIsParent: boolean;
};

// @ts-expect-error ts-migrate(2322) FIXME: Type 'null' is not assignable to type 'externalPub... Remove this comment to see the full error message
const pubEdgeType: PropTypes.Requireable<pubEdgeType> = PropTypes.shape({
	externalPublication: externalPublicationType,
	targetPub: PropTypes.shape({
		title: PropTypes.string,
		id: PropTypes.string,
	}),
	relationType: PropTypes.string.isRequired,
	pubIsParent: PropTypes.bool.isRequired,
});
export { pubEdgeType };
