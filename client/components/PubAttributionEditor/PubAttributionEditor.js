import React from 'react';
import PropTypes from 'prop-types';

import { AttributionEditor } from 'components';
import { usePendingChanges } from 'utils/hooks';

const propTypes = {
	canEdit: PropTypes.bool.isRequired,
	communityData: PropTypes.shape({
		id: PropTypes.string,
	}).isRequired,
	pubData: PropTypes.shape({
		id: PropTypes.string,
		attributions: PropTypes.array,
	}).isRequired,
	updatePubData: PropTypes.func.isRequired,
};

const PubAttributionEditor = (props) => {
	const { pubData, communityData, updatePubData, canEdit } = props;
	const { pendingPromise } = usePendingChanges();
	return (
		<AttributionEditor
			apiRoute="/api/pubAttributions"
			identifyingProps={{
				communityId: communityData.id,
				pubId: pubData.id,
			}}
			attributions={pubData.attributions}
			canEdit={canEdit}
			communityData={communityData}
			onUpdateAttributions={(attributions) => updatePubData({ attributions: attributions })}
			promiseWrapper={pendingPromise}
		/>
	);
};

PubAttributionEditor.propTypes = propTypes;
export default PubAttributionEditor;
