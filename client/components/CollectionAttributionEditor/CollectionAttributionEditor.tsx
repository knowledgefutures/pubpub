import React from 'react';

import { AttributionWithUser, Callback } from 'types';
import { usePendingChanges } from 'utils/hooks';
import { AttributionEditor } from 'components';

export type Props = {
	canEdit: boolean;
	communityId: string;
	collectionId: string;
	attributions: AttributionWithUser[];
	onUpdateAttributions: Callback<AttributionWithUser[]>;
};

const CollectionAttributionEditor = (props: Props) => {
	const { collectionId, communityId, attributions, onUpdateAttributions, canEdit } = props;
	const { pendingPromise } = usePendingChanges();
	return (
		<AttributionEditor
			apiRoute="/api/collectionAttributions"
			canEdit={canEdit}
			hasEmptyState={false}
			attributions={attributions!}
			listOnBylineText="Collection byline attribution"
			promiseWrapper={pendingPromise}
			onUpdateAttributions={onUpdateAttributions}
			identifyingProps={{
				collectionId,
				communityId,
			}}
		/>
	);
};
export default CollectionAttributionEditor;
