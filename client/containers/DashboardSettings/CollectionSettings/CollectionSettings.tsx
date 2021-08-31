import React from 'react';
import { useUpdateEffect } from 'react-use';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { AttributionEditor, DashboardFrame, SettingsSection } from 'components';

// TODO(ian): this should probably be moved somewhere else, but not sure where yet
import { useCollectionState } from '../../DashboardOverview/CollectionOverview/collectionState';

import CollectionDetailsEditor from './CollectionDetailsEditor';
import CollectionMetadataEditor from './CollectionMetadataEditor';

const CollectionSettings = () => {
	const {
		communityData,
		scopeData: {
			elements: { activeCollection },
		},
	} = usePageContext();
	const {
		collection,
		updateCollection,
		deleteCollection,
		slugStatus,
		hasChanges,
	} = useCollectionState(activeCollection);

	useUpdateEffect(() => {
		if (!hasChanges) {
			window.history.replaceState(
				{},
				'',
				getDashUrl({ collectionSlug: collection.slug, mode: 'settings' }),
			);
		}
	}, [collection.slug, hasChanges]);

	return (
		<DashboardFrame className="collection-settings-component" title="Settings">
			<SettingsSection title="Details">
				<CollectionDetailsEditor
					slugStatus={slugStatus}
					communityData={communityData}
					collection={collection}
					onUpdateCollection={updateCollection}
					onDeleteCollection={() =>
						deleteCollection().then(() => {
							window.location.href = getDashUrl({});
						})
					}
				/>
			</SettingsSection>
			{collection.kind !== 'tag' && (
				<SettingsSection title="Metadata" id="metadata">
					<CollectionMetadataEditor
						collection={collection}
						communityData={communityData}
						onUpdateCollection={updateCollection}
					/>
				</SettingsSection>
			)}
			{collection.kind !== 'tag' && (
				<SettingsSection title="Attribution" id="attribution">
					<AttributionEditor
						apiRoute="/api/collectionAttributions"
						canEdit={true}
						hasEmptyState={false}
						attributions={collection.attributions!}
						listOnBylineText="List on Collection byline"
						identifyingProps={{
							collectionId: collection.id,
							communityId: communityData.id,
						}}
						onUpdateAttributions={(attributions) => updateCollection({ attributions })}
					/>
				</SettingsSection>
			)}
		</DashboardFrame>
	);
};

export default CollectionSettings;
