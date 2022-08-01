import React from 'react';

import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { joinOxford, naivePluralize } from 'utils/strings';
import { MinimalUser, User } from 'types';

require('./byline.scss');

const isFullUser = (u: MinimalUser): u is User => 'slug' in u;

export type BylineProps = {
	ampersand?: boolean;
	bylinePrefix?: React.ReactNode;
	contributors: (string | {})[] | string;
	linkToUsers?: boolean;
	renderEmptyState?: () => React.ReactNode;
	renderSuffix?: () => React.ReactNode;
	renderTruncation?: (count: number) => React.ReactNode;
	renderUserLabel?: (user: any, index: number) => React.ReactNode;
	truncateAt?: number;
};

const defaultProps = {
	renderEmptyState: () => null,
	renderSuffix: () => null,
	renderTruncation: (n) => `${n} ${naivePluralize('other', n)}`,
	renderUserLabel: (user) => user.fullName,
};

const joinAndFlattenArrays = (...arrays) =>
	arrays.reduce((acc, next) => {
		if (Array.isArray(next)) {
			return [...acc, ...next];
		}
		return [...acc, next];
	}, []);

type OwnPrivateBylineProps = BylineProps;

type PrivateBylineProps = OwnPrivateBylineProps;

const Byline = (props: PrivateBylineProps) => {
	const {
		ampersand = false,
		bylinePrefix = 'by',
		contributors,
		linkToUsers = true,
		renderEmptyState = defaultProps.renderEmptyState,
		renderSuffix = defaultProps.renderSuffix,
		renderTruncation = defaultProps.renderTruncation,
		renderUserLabel = defaultProps.renderUserLabel,
		truncateAt = null,
	} = props;

	const renderContributor = (contributor, index) => {
		if (typeof contributor === 'string') {
			return <span key={`author-${contributor}`}>{contributor}</span>;
		}
		const { user } = ensureUserForAttribution(contributor);
		const label = renderUserLabel(user, index);
		if (isFullUser(user) && user.slug && linkToUsers) {
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'never[]' is not assignable to type 'string'.
				{ joiner: joinAndFlattenArrays, ampersand, empty: [] },
			);
		}
		return joinOxford(contributors.map(renderContributor), {
			joiner: joinAndFlattenArrays,
			ampersand,
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'never[]' is not assignable to type 'string'.
			empty: [],
		});
	};

	return (
		<div className="byline-component">
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
Byline.defaultProps = defaultProps;
export default Byline;
