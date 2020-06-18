import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton, Button } from '@blueprintjs/core';
import { useBeforeUnload } from 'react-use';

import { communityUrl } from 'utils/canonicalUrls';
import { getDefaultLayout } from 'utils/pages';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { slugifyString } from 'utils/strings';
import { apiFetch } from 'client/utils/apiFetch';

import {
	DashboardFrame,
	ImageUpload,
	InputField,
	SettingsSection,
	ClickToCopyButton,
} from 'components';

import LayoutEditor from './LayoutEditor';
import PageDelete from './PageDelete';

require('./dashboardPage.scss');

const propTypes = {
	pageData: PropTypes.shape({
		title: PropTypes.string,
	}).isRequired,
};

const defaultLayout = getDefaultLayout();

const DashboardPages = (props) => {
	const [persistedPageData, setPersistedPageData] = useState(props.pageData);
	const [pendingPageData, setPendingPageData] = useState({});
	const [isPersisting, setIsPersisting] = useState(false);
	const { updateCommunity, locationData, scopeData } = usePageContext();
	const { pendingPromise } = usePendingChanges();
	const hasPendingChanges = Object.keys(pendingPageData).length > 0;

	const {
		elements: { activeCommunity },
	} = scopeData;

	const pageData = {
		...persistedPageData,
		...pendingPageData,
	};

	const {
		avatar,
		description,
		isNarrowWidth,
		isPublic,
		layout,
		pubs,
		slug,
		title,
		viewHash,
	} = pageData;

	useBeforeUnload(
		hasPendingChanges,
		'You have unsaved changes to this Page. Are you sure you want to navigate away?',
	);

	const updatePageData = (update) => {
		setPendingPageData({ ...pendingPageData, ...update });
	};

	const handleSaveChanges = () => {
		setIsPersisting(true);
		return pendingPromise(
			apiFetch('/api/pages', {
				method: 'PUT',
				body: JSON.stringify({
					...pendingPageData,
					pageId: pageData.id,
					communityId: activeCommunity.id,
				}),
			}),
		)
			.then((updatedValues) => {
				const newPageData = { ...persistedPageData, ...pendingPageData };
				setPendingPageData({});
				setIsPersisting(false);
				setPersistedPageData(newPageData);
				updateCommunity((communityData) => ({
					pages: communityData.pages.map((page) => {
						if (page.id !== pageData.id) {
							return page;
						}
						return {
							...page,
							...newPageData,
						};
					}),
				}));
				if (updatedValues.slug && locationData.params.slug !== updatedValues.slug) {
					window.location.href = getDashUrl({
						mode: 'pages',
						subMode: updatedValues.slug,
					});
				}
			})
			.catch((err) => {
				console.error(err);
				setIsPersisting(false);
			});
	};

	const renderControls = () => {
		const canPersistChanges = hasPendingChanges && title && (slug || !persistedPageData.slug);
		return (
			<React.Fragment>
				<AnchorButton icon="share" href={`/${slug}`}>
					Visit page
				</AnchorButton>
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

	const renderDetailsEditor = () => {
		return (
			<SettingsSection title="Details">
				<InputField
					label="Title"
					placeholder="Enter title"
					isRequired={true}
					value={title}
					onChange={(evt) => updatePageData({ title: evt.target.value })}
					error={undefined}
				/>
				<InputField
					label="Description"
					placeholder="Enter description"
					isTextarea={true}
					helperText="Used for search results and social media cards. Max 180 characters."
					value={description || ''}
					onChange={(evt) =>
						updatePageData({
							description: evt.target.value.substring(0, 280).replace(/\n/g, ' '),
						})
					}
					error={undefined}
				/>
				<ImageUpload
					htmlFor="dashboard-page-avatar"
					label="Preview Image"
					defaultImage={avatar}
					onNewImage={(value) => updatePageData({ avatar: value })}
					canClear={true}
					helperText="Used in social media cards"
				/>
				{slug && (
					<InputField
						label="Link"
						placeholder="Enter link"
						isRequired={true}
						helperText={`Page URL will be https://${locationData.hostname}/${slug}`}
						value={slug}
						onChange={(evt) =>
							updatePageData({ slug: slugifyString(evt.target.value) })
						}
						error={undefined}
					/>
				)}
				<InputField label="Width">
					<div className="bp3-button-group">
						<Button
							className={isNarrowWidth ? '' : 'bp3-active'}
							onClick={() => updatePageData({ isNarrowWidth: false })}
							text="Wide"
						/>
						<Button
							className={isNarrowWidth ? 'bp3-active' : ''}
							onClick={() => updatePageData({ isNarrowWidth: true })}
							text="Narrow"
						/>
					</div>
				</InputField>
				{slug && (
					<InputField label="Privacy">
						<div className="bp3-button-group">
							<Button
								className={isPublic ? 'bp3-active' : ''}
								onClick={() => updatePageData({ isPublic: true })}
								text="Public"
								icon="globe"
							/>
							<Button
								className={isPublic ? '' : 'bp3-active'}
								onClick={() => updatePageData({ isPublic: false })}
								text="Private"
								icon="lock"
							/>
							{!isPublic && (
								<ClickToCopyButton
									className="copy-button"
									icon="duplicate"
									beforeCopyPrompt="Anyone with this link can view the private Page."
									copyString={`${communityUrl(
										activeCommunity,
									)}/${slug}?access=${viewHash}`}
								>
									Copy shareable link
								</ClickToCopyButton>
							)}
						</div>
					</InputField>
				)}
			</SettingsSection>
		);
	};

	const renderLayoutEditor = () => {
		return (
			<SettingsSection title="Layout">
				<LayoutEditor
					onChange={(newLayout) => updatePageData({ layout: newLayout })}
					initialLayout={layout || defaultLayout}
					pubs={pubs}
					communityData={activeCommunity}
				/>
			</SettingsSection>
		);
	};

	const renderPageDeleter = () => {
		return (
			<SettingsSection title="Delete">
				<PageDelete pageData={pageData} communityId={activeCommunity.id} />
			</SettingsSection>
		);
	};

	return (
		<DashboardFrame
			className="dashboard-page-container"
			title={'Pages: ' + persistedPageData.title}
			controls={renderControls()}
		>
			{renderDetailsEditor()}
			{renderLayoutEditor()}
			{renderPageDeleter()}
		</DashboardFrame>
	);
};

DashboardPages.propTypes = propTypes;
export default DashboardPages;
