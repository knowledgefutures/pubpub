import React from 'react';

import { Icon, IconName } from 'components';
import { UserScopeVisit, Pub, Collection } from 'utils/types';
import { getDashUrl } from 'utils/dashboard';

require('./recentVisitList.scss');

type Props = {
	userScopeVisits: UserScopeVisit[];
	pubs: Pub[];
	collections: Collection[];
};

type Visit = {
	href: string;
	iconName: IconName;
	id: string;
	title: string;
};

const getRecentVisits = (userScopeVisits, pubs, collections): Visit[] =>
	userScopeVisits
		.sort((visitA, visitB) => (visitA.updatedAt > visitB.updatedAt ? -1 : 1))
		.reduce((memo: any, visit) => {
			const { pubId, collectionId } = visit;
			const isPub = !!pubId;
			const pub = pubs.find(({ id }) => id === pubId);
			const collection = collections.find(({ id }) => id === collectionId);
			if (!pub && !collection) return memo;
			return [
				...memo,
				{
					href: isPub
						? getDashUrl({ pubSlug: pub?.slug })
						: getDashUrl({ collectionSlug: collection?.slug }),
					iconName: isPub ? ('pubDoc' as const) : ('collection' as const),
					id: visit.id,
					title: (isPub ? pub?.title : collection?.title) || '',
				},
			];
		}, [])
		.slice(0, 5);

const RecentVisitList = (props: Props) => {
	const { userScopeVisits, pubs, collections } = props;
	const recentVisits = getRecentVisits(userScopeVisits, pubs, collections);

	return (
		<ol className="recent-visit-list-component">
			{recentVisits.map(({ id, title, iconName, href }) => (
				<li key={id} className="entry">
					<Icon icon={iconName} iconSize={16} />
					<a className="label" href={href}>
						{title}
					</a>
				</li>
			))}
		</ol>
	);
};

export default RecentVisitList;
