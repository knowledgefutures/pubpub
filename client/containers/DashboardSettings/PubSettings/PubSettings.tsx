import React, { useState } from 'react';
import { useBeforeUnload } from 'react-use';
import { Button, Tooltip } from '@blueprintjs/core';

import {
	Icon,
	DashboardFrame,
	DatePicker,
	SettingsSection,
	ImageUpload,
	InputField,
	LicenseSelect,
	PubAttributionEditor,
	PubThemePicker,
} from 'components';
import { apiFetch } from 'client/utils/apiFetch';
import { slugifyString } from 'utils/strings';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { pubUrl } from 'utils/canonicalUrls';

import DownloadChooser from './DownloadChooser';
import DeletePub from './DeletePub';
import Collections from './Collections';
import Doi from './Doi';
import CitationChooser from './CitationChooser';

type Props = {
	settingsData: {
		pubData: any;
	};
};

const PubSettings = (props: Props) => {
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
					communityId: activeCommunity.id,
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
						helperText={`Pub will be available at ${pubUrl(activeCommunity, pubData)}`}
						value={pubData.slug}
						onChange={(evt) => updatePubData({ slug: slugifyString(evt.target.value) })}
						error={!pubData.slug ? 'Required' : null}
					/>
					<InputField
						label="Custom publication date"
						helperText="If set, this will be shown instead of the first Release date."
					>
						<DatePicker
							// @ts-expect-error ts-migrate(2322) FIXME: Property 'style' does not exist on type 'Intrinsic... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'undefine... Remove this comment to see the full error message
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
									// @ts-expect-error ts-migrate(2322) FIXME: Property 'tooltipClassName' does not exist on type... Remove this comment to see the full error message
									tooltipClassName="bp3-dark"
								>
									<Icon icon="info-sign" />
								</Tooltip>
							</span>
						}
						canClear={true}
						key={pubData.avatar}
						defaultImage={pubData.avatar}
						// @ts-expect-error ts-migrate(2322) FIXME: Type '(value: any) => void' is not assignable to t... Remove this comment to see the full error message
						onNewImage={(value) => updatePubData({ avatar: value })}
						width={150}
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'undefine... Remove this comment to see the full error message
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
					communityData={activeCommunity}
				/>
			</SettingsSection>
		);
	};

	const renderCitationChooser = () => {
		return (
			<SettingsSection title="Citation Style">
				<CitationChooser
					pubData={pubData}
					communityId={activeCommunity.id}
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
		// @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message
		<DashboardFrame
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			className="pub-settings-container"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			title="Settings"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
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
			{renderDelete()}
		</DashboardFrame>
	);
};
export default PubSettings;
