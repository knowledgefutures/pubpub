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

// @ts-expect-error ts-migrate(2322) FIXME: Type 'Requireable<InferProps<{ title: Validator<st... Remove this comment to see the full error message
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
