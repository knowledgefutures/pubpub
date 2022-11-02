import React from 'react';
import { Button } from '@blueprintjs/core';

import { DashboardFrame, FacetEditor } from 'components';
import { useFacetsState } from 'client/utils/useFacets';

require('./dashboardFacets.scss');

const DashboardFacets = () => {
	const {
		persistFacets,
		isPersisting,
		hasPersistableChanges: hasPendingChanges,
		facets,
	} = useFacetsState();

	const facetEditors = Object.entries(facets).map(([facetName]) => {
		return <FacetEditor key={facetName} facetName={facetName as any} displayStyle="settings" />;
	});

	return (
		<DashboardFrame
			title="Facets"
			className="dashboard-facets-container"
			controls={
				<Button
					intent="primary"
					onClick={persistFacets}
					loading={isPersisting}
					disabled={!hasPendingChanges}
				>
					Save Changes
				</Button>
			}
		>
			<div className="editors">{facetEditors}</div>
		</DashboardFrame>
	);
};

export default DashboardFacets;
