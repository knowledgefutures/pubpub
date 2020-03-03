import React from 'react';
import PropTypes from 'prop-types';

import { DashboardRowListing } from 'components';
import { groupPubs } from '../../utils/dashboard';
import { fuzzyMatchCollection, fuzzyMatchPub } from './util';
import { useFilterAndSort } from './filterAndSort';
import ContentRow from './ContentRow';
import ContentOverviewFrame from './ContentOverviewFrame';

const propTypes = {
	overviewData: PropTypes.object.isRequired,
};

const filterCollections = (collections, filterText) => {
	return collections
		.map((collection) => {
			if (fuzzyMatchCollection(collection, filterText)) {
				return collection;
			}
			const filteredPubs = collection.pubs.filter((pub) => fuzzyMatchPub(pub, filterText));
			if (filteredPubs.length) {
				return { ...collection, pubs: filteredPubs };
			}
			return null;
		})
		.filter((coll) => !!coll);
};

const filterPubs = (pubs, filterText) => {
	return pubs.filter((pub) => fuzzyMatchPub(pub, filterText));
};

const CommunityOverview = (props) => {
	const { overviewData } = props;
	const { pubs, collections } = groupPubs(overviewData);
	const filterAndSort = useFilterAndSort();

	const filteredItems = [
		...filterCollections(collections, filterAndSort.filterText),
		...filterPubs(pubs, filterAndSort.filterText),
	];

	return (
		<ContentOverviewFrame contentLabel="Pubs and Collections" filterAndSort={filterAndSort}>
			<DashboardRowListing>
				{filteredItems.map((item) => (
					<ContentRow content={item} key={item.id} />
				))}
			</DashboardRowListing>
		</ContentOverviewFrame>
	);
};

CommunityOverview.propTypes = propTypes;
export default CommunityOverview;
