import React, { useState, useCallback } from 'react';
import { useBeforeUnload, useUpdateEffect } from 'react-use';
import { Button, ButtonGroup, RadioGroup, Radio } from '@blueprintjs/core';

import {
	DashboardFrame,
	SettingsSection,
	LayoutEditor,
	LinkedPageSelect,
	InputField,
	ImageUpload,
} from 'components';
import { usePageContext } from 'utils/hooks';
import { Collection, Pub } from 'types';
import { LayoutPubsByBlock } from 'utils/layout';
import { usePersistableState } from 'client/utils/usePersistableState';
import * as api from 'client/utils/collections/api';

require('./dashboardCollectionLayout.scss');

type Props = {
	collection: Collection;
	layoutPubsByBlock: LayoutPubsByBlock<Pub>;
};

const DashboardCollectionLayout = (props: Props) => {
	const { collection: initialCollection } = props;
	const { communityData } = usePageContext();
	const {
		state: collection,
		update: updateCollection,
		persist: handleSaveChanges,
		hasChanges,
		isPersisting,
	} = usePersistableState(initialCollection, (updatedCollection) =>
		api.updateCollection({
			communityId: communityData.id,
			collectionId: collection.id,
			updatedCollection,
		}),
	);

	const [isUsingBlocks, setIsUsingBlocks] = useState(!collection.pageId);
	const canPersistChanges = hasChanges && (isUsingBlocks || collection.pageId);
	const layout = collection.layout || { blocks: [] };

	const updateLayout = useCallback(
		(update: Partial<Collection['layout']>) =>
			updateCollection((data) => ({
				...data,
				layout: { ...data.layout, ...update },
			})),
		[updateCollection],
	);

	const updateBlocks = useCallback((blocks) => updateLayout({ blocks }), [updateLayout]);

	useUpdateEffect(() => {
		if (isUsingBlocks) {
			updateCollection({ pageId: null });
		}
	}, [isUsingBlocks, updateCollection]);

	useBeforeUnload(
		hasChanges,
		'You have unsaved changes to this Collection. Are you sure you want to navigate away?',
	);

	const renderControls = () => {
		return (
			<React.Fragment>
				<Button
					type="button"
					intent="primary"
					text="Save Changes"
					disabled={!canPersistChanges}
					loading={isPersisting}
					onClick={handleSaveChanges}
				/>
			</React.Fragment>
		);
	};

	const renderPageSelectLabel = () => {
		return (
			<>
				Use a Page as the landing page for this Collection: &nbsp;
				<LinkedPageSelect
					pages={communityData.pages}
					selectedPageId={collection.pageId || null}
					onSelectPage={(page) => updateCollection({ pageId: page.id })}
					disabled={isUsingBlocks}
				/>
			</>
		);
	};
	return (
		<DashboardFrame
			className="dashboard-collection-layout-container"
			title="Layout"
			details="Change how this Collection is presented to readers."
			controls={renderControls()}
		>
			<SettingsSection title="General">
				<RadioGroup
					className="layout-enable-radio"
					selectedValue={isUsingBlocks ? 1 : 0}
					onChange={(evt) => setIsUsingBlocks((evt.target as any).value === '1')}
				>
					<Radio labelElement="Use a layout for this Collection" value={1} />
					<Radio
						className="page-select"
						labelElement={renderPageSelectLabel()}
						value={0}
					/>
				</RadioGroup>
				<ImageUpload
					htmlFor="dashboard-page-avatar"
					label="Preview Image"
					defaultImage={collection.avatar}
					onNewImage={(value) => updateCollection({ avatar: value })}
					canClear={true}
					helperText="This image will appear in links from other Collections or Pages to this Collection."
				/>
				{isUsingBlocks && (
					<InputField label="Layout width">
						<ButtonGroup>
							<Button
								active={!layout.isNarrow}
								onClick={() => updateLayout({ isNarrow: false })}
								text="Wide"
							/>
							<Button
								active={layout.isNarrow}
								onClick={() => updateLayout({ isNarrow: true })}
								text="Narrow"
							/>
						</ButtonGroup>
					</InputField>
				)}
			</SettingsSection>
			{isUsingBlocks && (
				<SettingsSection title="Blocks">
					<LayoutEditor
						initialLayout={layout.blocks}
						initialLayoutPubsByBlock={props.layoutPubsByBlock}
						collection={collection}
						communityData={communityData}
						onChange={updateBlocks}
					/>
				</SettingsSection>
			)}
		</DashboardFrame>
	);
};
export default DashboardCollectionLayout;
