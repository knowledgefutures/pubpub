import React from 'react';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { AttributionEditor, DashboardFrame, SettingsSection } from 'components';

// TODO(ian): this should probably be moved somewhere else, but not sure where yet
import { useCollectionState } from '../../DashboardOverview/CollectionOverview/collectionState';

import CollectionDetailsEditor from './CollectionDetailsEditor';
import CollectionMetadataEditor from './CollectionMetadataEditor';

const CollectionSettings = () => {
	const { scopeData } = usePageContext();
	const { activeCommunity } = scopeData.elements;
	const { collection, updateCollection, deleteCollection } = useCollectionState(scopeData);

	return (
		<DashboardFrame className="collection-settings-component" title="Settings">
			<SettingsSection title="Details">
				<CollectionDetailsEditor
					collection={collection}
					communityData={activeCommunity}
					onUpdateCollection={updateCollection}
					onDeleteCollection={() =>
						deleteCollection().then(() => {
							window.location.href = getDashUrl({});
						})
					}
				/>
			</SettingsSection>
			{collection.kind !== 'tag' && (
				<SettingsSection title="Metadata">
					<CollectionMetadataEditor
						collection={collection}
						communityData={activeCommunity}
						onUpdateCollection={updateCollection}
					/>
				</SettingsSection>
			)}
			{collection.kind !== 'tag' && (
				<SettingsSection title="Attribution">
					<AttributionEditor
						apiRoute="/api/collectionAttributions"
						canEdit={true}
						hasEmptyState={false}
						attributions={collection.attributions}
						listOnBylineText="List on Pub byline"
						identifyingProps={{
							collectionId: collection.id,
							communityId: activeCommunity.id,
						}}
						onUpdateAttributions={(attributions) =>
							updateCollection({ attributions: attributions })
						}
					/>
				</SettingsSection>
			)}
		</DashboardFrame>
	);
};

export default CollectionSettings;
