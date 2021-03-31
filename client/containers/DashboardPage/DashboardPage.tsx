import React from 'react';
import { AnchorButton, Button } from '@blueprintjs/core';
import { useUpdateEffect } from 'react-use';

import { communityUrl } from 'utils/canonicalUrls';
import { getDefaultLayout } from 'utils/pages';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { slugifyString } from 'utils/strings';
import { LayoutPubsByBlock } from 'utils/layout';
import { apiFetch } from 'client/utils/apiFetch';

import {
	DashboardFrame,
	ImageUpload,
	InputField,
	SettingsSection,
	ClickToCopyButton,
	LayoutEditor,
} from 'components';
import { Page, Pub } from 'utils/types';
import { usePersistableState } from 'client/utils/usePersistableState';

import PageDelete from './PageDelete';

require('./dashboardPage.scss');

type Props = {
	pageData: Page & { layoutPubsByBlock: LayoutPubsByBlock<Pub> };
};

const defaultLayout = getDefaultLayout();

const DashboardPage = (props: Props) => {
	const { updateCommunity, locationData, communityData } = usePageContext();
	const { pendingPromise } = usePendingChanges();

	const {
		error,
		state: pageData,
		persistedState: persistedPageData,
		update: updatePageData,
		hasChanges,
		persist,
		isPersisting,
	} = usePersistableState(props.pageData, (update) =>
		pendingPromise(
			apiFetch('/api/pages', {
				method: 'PUT',
				body: JSON.stringify({
					...update,
					pageId: pageData.id,
					communityId: communityData.id,
				}),
			}),
		).then(() => {
			updateCommunity((currentCommunityData) => ({
				pages: currentCommunityData.pages.map((page) => {
					if (page.id !== pageData.id) {
						return page;
					}
					return { ...page, ...update };
				}),
			}));
		}),
	);

	const {
		avatar,
		description,
		isNarrowWidth,
		isPublic,
		layout,
		layoutPubsByBlock,
		slug,
		title,
		viewHash,
	} = pageData;
	const isHome = !persistedPageData.slug;

	const slugError = error?.fields?.slug
		? 'This slug is not available because it is in use by another Collection or Page.'
		: '';

	useUpdateEffect(() => {
		if (!hasChanges) {
			window.history.replaceState(
				{},
				'',
				getDashUrl({
					mode: 'pages',
					subMode: slug,
				}),
			);
		}
	}, [slug, hasChanges]);

	const renderControls = () => {
		const canPersistChanges = hasChanges && title && (slug || !persistedPageData.slug);
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
					onClick={persist}
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
					helperText="This image will appear in links from other Pages or Collections to this Page."
				/>
				{!isHome && (
					<InputField
						label="Link"
						placeholder="Enter link"
						isRequired={true}
						helperText={`Page URL will be https://${locationData.hostname}/${slug}`}
						value={slug}
						error={slugError}
						onChange={(evt) =>
							updatePageData({ slug: slugifyString(evt.target.value) })
						}
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
				{!isHome && (
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
										communityData,
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
					initialLayoutPubsByBlock={layoutPubsByBlock}
					communityData={communityData}
				/>
			</SettingsSection>
		);
	};

	const renderPageDelete = () => {
		return (
			<SettingsSection title="Delete">
				<PageDelete pageData={pageData} communityId={communityData.id} />
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
			{renderPageDelete()}
		</DashboardFrame>
	);
};
export default DashboardPage;
