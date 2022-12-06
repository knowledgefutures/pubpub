import React, { useCallback, useState } from 'react';
import { Classes, Button, Dialog, Radio, RadioGroup } from '@blueprintjs/core';

import { LandingPageCommunityFeature } from 'types';
import { InputField, MinimalEditor, ColorInput, ImageUpload } from 'components';
import { apiFetch } from 'client/utils/apiFetch';

require('./featuredCommunityPayloadDialog.scss');

type Props = {
	isOpen: boolean;
	onClose: () => unknown;
	feature: LandingPageCommunityFeature;
	onSavePayload: (payload: LandingPageCommunityFeature['payload']) => unknown;
};

const FeaturedCommunityPayloadDialog = (props: Props) => {
	const { isOpen, onClose, feature, onSavePayload } = props;
	const { community } = feature;
	const [payload, setPayload] = useState(feature.payload);
	const [isSaving, setIsSaving] = useState(false);
	const backgroundColorType = payload?.backgroundColor ? 'custom' : 'community';

	const handleSaveClick = useCallback(async () => {
		setIsSaving(true);
		await apiFetch.put('api/landingPageFeatures', {
			landingPageFeature: {
				id: feature.id,
				payload,
			},
		});
		onSavePayload(payload);
		setIsSaving(false);
		onClose();
	}, [payload, onClose, onSavePayload, feature.id]);

	const handleUpdatePayload = useCallback(
		(next: Partial<LandingPageCommunityFeature['payload']>) => {
			setPayload((p) => ({ backgroundColor: null, ...p, ...next }));
		},
		[],
	);

	const handleColorSelectionChanged = useCallback(
		(evt: any) => {
			handleUpdatePayload({
				backgroundColor: evt.target.value === 'community' ? null : '#fff',
			});
		},
		[handleUpdatePayload],
	);

	const renderInner = () => {
		return (
			<>
				<InputField label="Image">
					<ImageUpload
						helperText="Recommended: 900x500px"
						canClear
						defaultImage={payload?.imageUrl}
						onNewImage={(imageUrl) => handleUpdatePayload({ imageUrl })}
					/>
				</InputField>
				<InputField label="Quote">
					<MinimalEditor
						initialContent={payload?.quote}
						onContent={({ content }) => handleUpdatePayload({ quote: content })}
					/>
				</InputField>
				<InputField label="Highlights">
					<MinimalEditor
						initialContent={payload?.highlights}
						onContent={({ content }) => handleUpdatePayload({ highlights: content })}
					/>
				</InputField>
				<InputField label="Background color">
					<RadioGroup
						selectedValue={backgroundColorType}
						onChange={handleColorSelectionChanged}
					>
						<Radio value="community">
							Use the Community dark accent color as the background
						</Radio>
						<Radio value="custom">
							Use a custom color{backgroundColorType === 'custom' ? ':' : ''}
						</Radio>
					</RadioGroup>
					{backgroundColorType === 'custom' && (
						<ColorInput
							value={payload?.backgroundColor}
							onChange={(color) =>
								handleUpdatePayload({ backgroundColor: color.hex })
							}
						/>
					)}
				</InputField>
			</>
		);
	};

	return (
		<Dialog isOpen={isOpen} className="featured-community-payload-dialog-component">
			<div className={Classes.DIALOG_HEADER}>
				Update details for&nbsp;<b>{community.title}</b>
			</div>
			<div className={Classes.DIALOG_BODY}>{renderInner()}</div>
			<div className={Classes.DIALOG_FOOTER}>
				<div className={Classes.DIALOG_FOOTER_ACTIONS}>
					<Button onClick={onClose}>Cancel</Button>
					<Button intent="primary" onClick={handleSaveClick} loading={isSaving}>
						Save
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default FeaturedCommunityPayloadDialog;
