import React from 'react';

import { AttributionEditor } from 'components';
import { usePendingChanges } from 'utils/hooks';

type Props = {
	canEdit: boolean;
	communityData: {
		id?: string;
	};
	pubData: {
		id?: string;
		attributions?: any[];
	};
	updatePubData: (...args: any[]) => any;
};

const PubAttributionEditor = (props: Props) => {
	const { pubData, communityData, updatePubData, canEdit } = props;
	const { pendingPromise } = usePendingChanges();
	return (
		<AttributionEditor
			apiRoute="/api/pubAttributions"
			identifyingProps={{
				communityId: communityData.id,
				pubId: pubData.id,
			}}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'any[]'... Remove this comment to see the full error message
			attributions={pubData.attributions}
			canEdit={canEdit}
			communityData={communityData}
			onUpdateAttributions={(attributions) => updatePubData({ attributions: attributions })}
			promiseWrapper={pendingPromise}
		/>
	);
};
export default PubAttributionEditor;
