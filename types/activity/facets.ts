import type { Diff } from '../util';
import type { InsertableActivityItemBase } from './base';

export type FacetInstanceUpdatedActivityItem = InsertableActivityItemBase & {
	kind: 'facet-instance-updated';
	payload: {
		facetName: string;
		facetProps: Partial<Record<string, Diff<any>>>;
	};
};

export type FacetsActivityItem = FacetInstanceUpdatedActivityItem;
