import React, { useState } from 'react';
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

type Props = {
	pageData: {
		title?: string;
	};
};

const defaultLayout = getDefaultLayout();

const DashboardPages = (props: Props) => {
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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'avatar' does not exist on type '{ title?... Remove this comment to see the full error message
		avatar,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'description' does not exist on type '{ t... Remove this comment to see the full error message
		description,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isNarrowWidth' does not exist on type '{... Remove this comment to see the full error message
		isNarrowWidth,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'isPublic' does not exist on type '{ titl... Remove this comment to see the full error message
		isPublic,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'layout' does not exist on type '{ title?... Remove this comment to see the full error message
		layout,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'pubs' does not exist on type '{ title?: ... Remove this comment to see the full error message
		pubs,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type '{ title?: ... Remove this comment to see the full error message
		slug,
		title,
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'viewHash' does not exist on type '{ titl... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{ title?: st... Remove this comment to see the full error message
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
						// @ts-expect-error ts-migrate(2339) FIXME: Property 'id' does not exist on type '{ title?: st... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2345) FIXME: Type '{ mode: string; subMode: any; }' is missing ... Remove this comment to see the full error message
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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'slug' does not exist on type '{ title?: ... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message
					label="Preview Image"
					defaultImage={avatar}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(value: any) => void' is not assignable to t... Remove this comment to see the full error message
					onNewImage={(value) => updatePageData({ avatar: value })}
					canClear={true}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message
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
								// @ts-expect-error ts-migrate(2745) FIXME: This JSX tag's 'children' prop expects type 'never... Remove this comment to see the full error message
								<ClickToCopyButton
									// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
									className="copy-button"
									// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
									icon="duplicate"
									// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
									beforeCopyPrompt="Anyone with this link can view the private Page."
									// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
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
		// @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message
		<DashboardFrame
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			className="dashboard-page-container"
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
			title={'Pages: ' + persistedPageData.title}
			// @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
			controls={renderControls()}
		>
			{renderDetailsEditor()}
			{renderLayoutEditor()}
			{renderPageDeleter()}
		</DashboardFrame>
	);
};
export default DashboardPages;
