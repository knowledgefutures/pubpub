import React, { useCallback } from 'react';
import { Switch } from '@blueprintjs/core';

import { CollectionMultiSelect, InputField, SettingsSection } from 'components';
import { Callback, Community } from 'types';

type Props = {
	communityData: Community;
	updateCommunityData: Callback<Partial<Community>>;
};

const createPub = <>"Create Pub"</>;

const PublicNewPubs = (props: Props) => {
	const { communityData, updateCommunityData } = props;
	const { hideCreatePubButton, defaultPubCollections } = communityData;

	const handleAddDefaultCollection = useCallback(
		(collectionId: string) => {
			const existingCollectionIds = defaultPubCollections || [];
			const newCollectionIds = [...existingCollectionIds, collectionId];
			updateCommunityData({ defaultPubCollections: newCollectionIds });
		},
		[updateCommunityData, defaultPubCollections],
	);

	const handleRemoveDefaultCollection = useCallback(
		(evt: Event, collectionIndex: number) => {
			const existingCollectionIds = defaultPubCollections || [];
			const newCollectionIds = existingCollectionIds.filter((item, filterIndex) => {
				return filterIndex !== collectionIndex;
			});
			updateCommunityData({ defaultPubCollections: newCollectionIds });
		},
		[updateCommunityData, defaultPubCollections],
	);

	return (
		<SettingsSection
			title="Pub creation by visitors"
			description={
				<>
					You can enable the {createPub} button in the header for all visitors to your
					Community. These Pubs can be released to the public after undergoing review by
					Community members.
				</>
			}
		>
			<InputField
				helperText={
					<>
						The button will always be available to Community members with permission to
						create Pubs.
					</>
				}
			>
				<Switch
					large
					labelElement={<>Show {createPub} button for all users</>}
					checked={!hideCreatePubButton}
					onChange={(evt) => {
						updateCommunityData({ hideCreatePubButton: !(evt.target as any).checked });
					}}
				/>
			</InputField>
			<InputField
				label={<>Default {createPub} Collections</>}
				isDisabled={hideCreatePubButton}
				helperText={
					<>Keep track of Pubs created this way by adding them to a Collection.</>
				}
			>
				<CollectionMultiSelect
					allCollections={communityData.collections as any}
					selectedCollectionIds={defaultPubCollections || []}
					onItemSelect={handleAddDefaultCollection}
					onRemove={handleRemoveDefaultCollection}
					placeholder="Select Collections..."
				/>
			</InputField>
		</SettingsSection>
	);
};

export default PublicNewPubs;
