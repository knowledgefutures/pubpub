import React, { useState } from 'react';
import { useUpdateEffect } from 'react-use';

import { usePageContext } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { CollectionAttributionEditor, FacetEditor, SettingsSection } from 'components';
import { pruneFalsyValues } from 'utils/arrays';
import { ALL_FACET_DEFINITIONS, FacetName } from 'facets';
import { AttributionWithUser } from 'types';
import { useCollectionState } from '../../DashboardOverview/CollectionOverview/collectionState';

import CollectionDetailsEditor from './CollectionDetailsEditor';
import CollectionMetadataEditor from './CollectionMetadataEditor';
import DashboardSettingsFrame, { Subtab } from '../DashboardSettingsFrame';

const CollectionSettings = () => {
	const {
		communityData,
		featureFlags,
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
		persistCollection,
	} = useCollectionState(activeCollection!);
	const [collectionAttributions, setCollectionAttributions] = useState<AttributionWithUser[]>(
		collection.attributions as AttributionWithUser[],
	);

	useUpdateEffect(() => {
		if (!hasChanges) {
			window.history.replaceState(
				{},
				'',
				getDashUrl({ collectionSlug: collection.slug, mode: 'settings' }),
			);
		}
	}, [collection.slug, hasChanges]);

	const tabs: Subtab[] = pruneFalsyValues([
		{
			id: 'details',
			title: 'Details',
			icon: 'settings',
			sections: [
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
				/>,
			],
		},
		collection.kind !== 'tag' && {
			id: 'metadata',
			title: 'Metadata',
			icon: 'heat-grid',
			sections: [
				<SettingsSection title="Metadata" id="metadata" showTitle={false}>
					<CollectionMetadataEditor
						collection={collection}
						communityData={communityData}
						onUpdateCollection={updateCollection}
					/>
				</SettingsSection>,
			],
		},
		collection.kind !== 'tag' && {
			id: 'contributors',
			title: 'Contributors',
			pubPubIcon: 'contributor',
			hideSaveButton: true,
			sections: [
				<SettingsSection title="Attribution" id="attribution" showTitle={false}>
					<CollectionAttributionEditor
						canEdit
						attributions={collectionAttributions!}
						onUpdateAttributions={setCollectionAttributions}
						collectionId={collection.id}
						communityId={communityData.id}
					/>
				</SettingsSection>,
			],
		},
		collection.kind !== 'tag' &&
			featureFlags.showPubSettingsForCollection && {
				id: 'pub-defaults',
				title: 'Pub settings',
				pubPubIcon: 'pub',
				sections: Object.keys(ALL_FACET_DEFINITIONS).map((facetName) => (
					<FacetEditor key={facetName} facetName={facetName as FacetName} />
				)),
			},
	]);

	return (
		<DashboardSettingsFrame
			id="collection-settings"
			className="collection-settings-component"
			tabs={tabs}
			hasChanges={hasChanges}
			persist={persistCollection}
		/>
	);
};

export default CollectionSettings;
