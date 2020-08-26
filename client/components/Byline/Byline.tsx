import React from 'react';

import ensureUserForAttribution from 'utils/ensureUserForAttribution';
import { joinOxford, naivePluralize } from 'utils/strings';

type OwnProps = {
	ampersand?: boolean;
	bylinePrefix?: string;
	contributors: (string | {})[] | string;
	linkToUsers?: boolean;
	renderEmptyState?: (...args: any[]) => any;
	renderSuffix?: (...args: any[]) => any;
	renderTruncation?: (...args: any[]) => any;
	renderUserLabel?: (...args: any[]) => any;
	truncateAt?: number;
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

type Props = OwnProps & typeof defaultProps;

const Byline = (props: Props) => {
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
		// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'never'.
		if (truncateAt !== null && contributors.length > truncateAt) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'slice' does not exist on type 'never'.
			const namedContributors = contributors.slice(0, truncateAt);
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'never'.
			const remainingCount = contributors.length - namedContributors.length;
			return joinOxford(
				// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
				[...namedContributors.map(renderContributor), renderTruncation(remainingCount)],
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'never[]' is not assignable to type 'string'.
				{ joiner: joinAndFlattenArrays, ampersand: ampersand, empty: [] },
			);
		}
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'map' does not exist on type 'never'.
		return joinOxford(contributors.map(renderContributor), {
			joiner: joinAndFlattenArrays,
			ampersand: ampersand,
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'never[]' is not assignable to type 'string'.
			empty: [],
		});
	};

	return (
		<div className="byline-component byline">
			<span className="text-wrapper">
				{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'never'. */}
				{contributors.length > 0 && (
					<>
						{bylinePrefix && <span>{bylinePrefix} </span>}
						{renderContributors()}
					</>
				)}
				{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'never'. */}
				{contributors.length === 0 && renderEmptyState()}
				{/* @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures. */}
				{renderSuffix && renderSuffix()}
			</span>
		</div>
	);
};
Byline.defaultProps = defaultProps;
export default Byline;
