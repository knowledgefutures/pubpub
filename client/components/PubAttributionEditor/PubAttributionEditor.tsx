import React from 'react';

import { Community, Pub, Callback } from 'types';
import { usePendingChanges } from 'utils/hooks';
import { AttributionEditor } from 'components';

export type Props = {
	canEdit: boolean;
	communityData: Community;
	pubData: Pub;
	updatePubData: Callback<Partial<Pub>>;
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
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'any[] | undefined' is not assignable to type... Remove this comment to see the full error message
			attributions={pubData.attributions}
			canEdit={canEdit}
			communityData={communityData}
			onUpdateAttributions={(attributions) => updatePubData({ attributions })}
			promiseWrapper={pendingPromise}
		/>
	);
};
export default PubAttributionEditor;
