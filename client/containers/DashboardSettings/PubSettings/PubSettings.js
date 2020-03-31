import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useBeforeUnload } from 'react-use';
import { Button, Tooltip } from '@blueprintjs/core';

import { apiFetch, slugifyString } from 'utils';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { pubUrl } from 'shared/utils/canonicalUrls';
import {
	Icon,
	DashboardFrame,
	SettingsSection,
	ImageUpload,
	InputField,
	LicenseSelect,
	PubAttributionEditor,
	PubThemePicker,
} from 'components';

import DownloadChooser from './DownloadChooser';
import DeletePub from './DeletePub';
import Collections from './Collections';
import Doi from './Doi';

const propTypes = {
	settingsData: PropTypes.shape({
		pubData: PropTypes.object.isRequired,
	}).isRequired,
};

const PubSettings = (props) => {
	const { settingsData } = props;
	const { scopeData } = usePageContext();
	const {
		elements: { activeCommunity },
		activePermissions: { canManageCommunity, canAdminCommunity, canManage },
	} = scopeData;
	const [persistedPubData, setPersistedPubData] = useState(settingsData.pubData);
	const [pendingPubData, setPendingPubData] = useState({});
	const [isPersisting, setIsPersisting] = useState(false);
	const { pendingPromise } = usePendingChanges();

	const hasPendingChanges = Object.keys(pendingPubData).length > 0;
	const pubData = { ...persistedPubData, ...pendingPubData, description: '' };

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
					communityId: activeCommunity.id,
				}),
			}),
		)
			.then(() => {
				setPendingPubData({});
				setIsPersisting(false);
				setPersistedPubData({ ...persistedPubData, ...pendingPubData });
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
						helperText={`Pub will be available at ${pubUrl(activeCommunity, pubData)}`}
						value={pubData.slug}
						onChange={(evt) => updatePubData({ slug: slugifyString(evt.target.value) })}
						error={!pubData.slug ? 'Required' : null}
					/>
					<InputField
						label="Description"
						placeholder="Enter description"
						helperText={`${pubData.description.length}/280 characters`}
						isTextarea={true}
						value={pubData.description}
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
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
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
					communityData={activeCommunity}
				/>
			</SettingsSection>
		);
	};

	const renderDoi = () => {
		return (
			<SettingsSection title="DOI">
				<Doi
					pubData={pubData}
					communityData={activeCommunity}
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
					communityData={activeCommunity}
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
					communityId={activeCommunity.id}
					onSetDownloads={(downloads) => updatePersistedPubData({ downloads: downloads })}
				/>
			</SettingsSection>
		);
	};

	const renderCollections = () => {
		return (
			<SettingsSection title="Collections">
				<Collections
					pubData={pubData}
					communityData={activeCommunity}
					updatePubData={(nextPubData) => updatePersistedPubData(nextPubData)}
					canCreateCollections={canManageCommunity}
					promiseWrapper={pendingPromise}
				/>
			</SettingsSection>
		);
	};

	const renderDelete = () => {
		return (
			<SettingsSection title="Delete">
				<DeletePub communityData={activeCommunity} pubData={pubData} />
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
			{renderDoi()}
			{renderAttributions()}
			{renderFormattedDownload()}
			{renderCollections()}
			{renderDelete()}
		</DashboardFrame>
	);
};

PubSettings.propTypes = propTypes;
export default PubSettings;
