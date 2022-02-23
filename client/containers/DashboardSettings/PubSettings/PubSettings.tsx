import React, { useState } from 'react';
import { useBeforeUnload } from 'react-use';
import { Button, Tooltip } from '@blueprintjs/core';

import {
	Icon,
	DashboardFrame,
	DatePicker,
	DownloadChooser,
	SettingsSection,
	ImageUpload,
	InputField,
	LicenseSelect,
	PubAttributionEditor,
	PubThemePicker,
	PubCollectionsListing,
} from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { slugifyString } from 'utils/strings';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { pubUrl } from 'utils/canonicalUrls';

import DeletePub from './DeletePub';
import Doi from './Doi';
import CitationChooser from './CitationChooser';
import NodeLabelEditor from './NodeLabelEditor';

type Props = {
	settingsData: {
		pubData: any;
	};
};

const PubSettings = (props: Props) => {
	const { settingsData } = props;
	const { scopeData, communityData } = usePageContext();
	const {
		activePermissions: { canAdminCommunity, canManage },
	} = scopeData;
	const [persistedPubData, setPersistedPubData] = useState(settingsData.pubData);
	const [pendingPubData, setPendingPubData] = useState({});
	const [isPersisting, setIsPersisting] = useState(false);
	const { pendingPromise } = usePendingChanges();

	const hasPendingChanges = Object.keys(pendingPubData).length > 0;
	const pubData = { ...persistedPubData, ...pendingPubData };
	const description = pubData.description || '';

	useBeforeUnload(
		hasPendingChanges,
		'You have unsaved changes to this Pub. Are you sure you want to navigate away?',
	);

	const updatePubData = (values) => {
		setPendingPubData({ ...pendingPubData, ...values });
	};

	const updatePersistedPubData = (values) => {
		setPersistedPubData({ ...persistedPubData, ...values });
	};

	const handleSaveChanges = () => {
		setIsPersisting(true);
		return pendingPromise(
			apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					...pendingPubData,
					pubId: pubData.id,
					communityId: communityData.id,
				}),
			}),
		)
			.then(() => {
				const nextPubData = { ...persistedPubData, ...pendingPubData };
				setPendingPubData({});
				setIsPersisting(false);
				setPersistedPubData(nextPubData);
				if (persistedPubData.slug !== nextPubData.slug) {
					window.location.href = getDashUrl({
						pubSlug: nextPubData.slug,
						mode: 'settings',
					});
				}
			})
			.catch((err) => {
				console.error(err);
				setIsPersisting(false);
			});
	};

	const renderControls = () => {
		const canPersistChanges = hasPendingChanges && pubData.title && pubData.slug;
		return (
			<Button
				type="button"
				intent="primary"
				text="Save Changes"
				disabled={!canPersistChanges}
				loading={isPersisting}
				onClick={handleSaveChanges}
			/>
		);
	};

	const renderDetails = () => {
		return (
			<React.Fragment>
				<SettingsSection title="Details">
					<InputField
						label="Title"
						value={pubData.title}
						onChange={(evt) => updatePubData({ title: evt.target.value })}
						error={!pubData.title ? 'Required' : null}
					/>
					<InputField
						label="Link"
						helperText={`Pub will be available at ${pubUrl(communityData, pubData)}`}
						value={pubData.slug}
						onChange={(evt) => updatePubData({ slug: slugifyString(evt.target.value) })}
						error={!pubData.slug ? 'Required' : null}
					/>
					<InputField
						label="Custom publication date"
						helperText="If set, this will be shown instead of the first Release date."
					>
						<DatePicker
							// @ts-expect-error ts-migrate(2322) FIXME: Type '{ style: { width: number; }; date: any; onSe... Remove this comment to see the full error message
							style={{ width: 200 }}
							date={pubData.customPublishedAt}
							onSelectDate={(date) =>
								updatePubData({ customPublishedAt: date && date.toUTCString() })
							}
						/>
					</InputField>
					<InputField
						label="Description"
						placeholder="Enter description"
						helperText={`${(pubData.description || '').length}/280 characters`}
						isTextarea={true}
						value={description}
						onChange={(evt) =>
							updatePubData({
								description: evt.target.value.substring(0, 280).replace(/\n/g, ' '),
							})
						}
						error={undefined}
					/>
					<ImageUpload
						htmlFor="avatar-upload"
						label={
							<span>
								Preview Image
								<Tooltip
									content={
										<span>
											Image to be associated with this pub when it is shown in{' '}
											<br />
											other pages as part a preview link or in a listing of
											pubs.
										</span>
									}
									// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; content: Element; toolt... Remove this comment to see the full error message
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
						canClear={true}
						key={pubData.avatar}
						defaultImage={pubData.avatar}
						onNewImage={(value) => updatePubData({ avatar: value })}
						width={150}
						helperText={
							<span>
								Suggested minimum dimensions: <br />
								1200px x 800px
							</span>
						}
					/>
					<Button
						disabled={pubData.avatar === pubData.headerBackgroundImage}
						onClick={() => updatePubData({ avatar: pubData.headerBackgroundImage })}
					>
						Use header image as preview
					</Button>
				</SettingsSection>
			</React.Fragment>
		);
	};

	const renderLicense = () => {
		return (
			<SettingsSection title="License">
				<LicenseSelect
					persistSelections={false}
					pubData={pubData}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(license: any) => void' is not assignable to... Remove this comment to see the full error message
					onSelect={(license) => updatePubData({ licenseSlug: license.slug })}
				>
					{({ title, icon }) => (
						<Button icon={icon} text={title} rightIcon="caret-down" />
					)}
				</LicenseSelect>
			</SettingsSection>
		);
	};

	const renderTheme = () => {
		return (
			<SettingsSection title="Theme">
				<PubThemePicker
					updatePubData={updatePubData}
					pubData={pubData}
					communityData={communityData}
				/>
			</SettingsSection>
		);
	};

	const renderCitationChooser = () => {
		return (
			<SettingsSection title="Citation Style">
				<CitationChooser
					pubData={pubData}
					communityId={communityData.id}
					onSetCitations={(citationUpdate) => updatePersistedPubData(citationUpdate)}
				/>
			</SettingsSection>
		);
	};

	const renderDoi = () => {
		return (
			<SettingsSection title="DOI">
				<Doi
					pubData={persistedPubData}
					communityData={communityData}
					updatePubData={updatePersistedPubData}
					canIssueDoi={canAdminCommunity}
				/>
			</SettingsSection>
		);
	};

	const renderAttributions = () => {
		return (
			<SettingsSection title="Attributions">
				<PubAttributionEditor
					pubData={pubData}
					communityData={communityData}
					updatePubData={updatePersistedPubData}
					canEdit={canManage}
				/>
			</SettingsSection>
		);
	};

	const renderFormattedDownload = () => {
		return (
			<SettingsSection title="Download">
				<DownloadChooser
					pubData={pubData}
					communityId={communityData.id}
					onSetDownloads={(downloads) => updatePersistedPubData({ downloads })}
				/>
			</SettingsSection>
		);
	};

	const renderCollections = () => {
		return (
			<SettingsSection title="Collections">
				<PubCollectionsListing
					pub={pubData}
					allCollections={communityData.collections}
					collectionPubs={pubData.collectionPubs}
					updateCollectionPubs={(nextCollectionPubs) =>
						updatePersistedPubData({ collectionPubs: nextCollectionPubs })
					}
					canManage={canManage}
				/>
			</SettingsSection>
		);
	};

	const renderDelete = () => {
		return (
			<SettingsSection title="Delete">
				<DeletePub communityData={communityData} pubData={pubData} />
			</SettingsSection>
		);
	};

	const renderNodeLabelEditor = () => {
		return (
			<SettingsSection title="Item Labels" id="block-labels">
				<NodeLabelEditor pubData={persistedPubData} updatePubData={updatePubData} />
			</SettingsSection>
		);
	};

	return (
		<DashboardFrame
			className="pub-settings-container"
			title="Settings"
			controls={renderControls()}
		>
			{renderDetails()}
			{renderLicense()}
			{renderTheme()}
			{renderCitationChooser()}
			{renderDoi()}
			{renderAttributions()}
			{renderFormattedDownload()}
			{renderCollections()}
			{renderNodeLabelEditor()}
			{renderDelete()}
		</DashboardFrame>
	);
};
export default PubSettings;
