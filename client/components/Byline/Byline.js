import React from 'react';
import PropTypes from 'prop-types';

import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { joinOxford, naivePluralize } from 'utils/strings';

export const propTypes = {
	ampersand: PropTypes.bool,
	bylinePrefix: PropTypes.string,
	contributors: PropTypes.oneOfType([
		// Array of authors (e.g. from pub data)
		PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.shape({})])),
		// Byline (e.g. from ExternalPublication)
		PropTypes.string,
	]).isRequired,
	linkToUsers: PropTypes.bool,
	renderEmptyState: PropTypes.func,
	renderSuffix: PropTypes.func,
	renderTruncation: PropTypes.func,
	renderUserLabel: PropTypes.func,
	truncateAt: PropTypes.number,
};

export const defaultProps = {
	ampersand: false,
	bylinePrefix: 'by',
	linkToUsers: true,
	renderEmptyState: () => null,
	renderSuffix: () => null,
	renderTruncation: (n) => `${n} ${naivePluralize('other', n)}`,
	renderUserLabel: (user) => user.fullName,
	truncateAt: null,
};

const joinAndFlattenArrays = (...arrays) =>
	arrays.reduce((acc, next) => {
		if (Array.isArray(next)) {
			return [...acc, ...next];
		}
		return [...acc, next];
	}, []);

const Byline = (props) => {
	const {
		ampersand,
		bylinePrefix,
		contributors,
		linkToUsers,
		renderEmptyState,
		renderSuffix,
		renderTruncation,
		renderUserLabel,
		truncateAt,
	} = props;

	const renderContributor = (contributor, index) => {
		if (typeof contributor === 'string') {
			return <span key={`author-${contributor}`}>{contributor}</span>;
		}
		const { user } = ensureUserForAttribution(contributor);
		const label = renderUserLabel(user, index);
		if (user.slug && linkToUsers) {
			return (
				<span key={`author-${user.id}`}>
					<a href={`/user/${user.slug}`} className="hoverline">
						{label}
					</a>
				</span>
			);
		}
		return <span key={`author-${user.id}`}>{label}</span>;
	};

	const renderContributors = () => {
		if (typeof contributors === 'string') {
			return contributors;
		}
		if (truncateAt !== null && contributors.length > truncateAt) {
			const namedContributors = contributors.slice(0, truncateAt);
			const remainingCount = contributors.length - namedContributors.length;
			return joinOxford(
				[...namedContributors.map(renderContributor), renderTruncation(remainingCount)],
				{ joiner: joinAndFlattenArrays, ampersand: ampersand },
			);
		}
		return joinOxford(contributors.map(renderContributor), {
			joiner: joinAndFlattenArrays,
			ampersand: ampersand,
		});
	};

	return (
		<div className="byline-component byline">
			<span className="text-wrapper">
				{contributors.length > 0 && (
					<>
						{bylinePrefix && <span>{bylinePrefix} </span>}
						{renderContributors()}
					</>
				)}
				{contributors.length === 0 && renderEmptyState()}
				{renderSuffix && renderSuffix()}
			</span>
		</div>
	);
};

Byline.propTypes = propTypes;
Byline.defaultProps = defaultProps;
export default Byline;
