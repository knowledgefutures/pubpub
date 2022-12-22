import React, { useState } from 'react';
import { Popover } from 'components/Popover';

import { usePageContext } from 'utils/hooks';
import { PubPageData } from 'types';
import { getAnchoredDiscussionIds } from 'components/Editor/plugins/discussions';
import { DialogLauncher, SubscriptionButton } from 'components';
import { usePubContext } from 'containers/Pub/pubHooks';

import SortList from './SortList';
import FilterMenu from './FilterMenu';
import DiscussionsReleaseDialog from './DiscussionsReleaseDialog';
import PubDiscussions from '../../PubDiscussions/PubDiscussions';
import PubBottomSection, { SectionBullets, AccentedIconButton } from '../PubBottomSection';
import { filterAndSortDiscussions } from '../../PubDiscussions/discussionUtils';

type Props = {
	pubData: PubPageData;
	updateLocalData: (...args: any[]) => any;
	sideContentRef: any;
	mainContentRef: any;
};

const DiscussionsSection = (props: Props) => {
	const { pubData, updateLocalData, sideContentRef, mainContentRef } = props;
	const { discussions, isRelease } = pubData;
	const {
		communityData,
		scopeData,
		featureFlags,
		loginData: { id: userId },
	} = usePageContext();
	const {
		pubData: { subscription },
		updatePubData,
		collabData: { editorChangeObject },
	} = usePubContext();
	const { canView, canManage, canCreateDiscussions } = scopeData.activePermissions;
	const [isBrowsingArchive, setIsBrowsingArchive] = useState(false);
	const [isShowingAnchoredComments, setShowingAnchoredComments] = useState(true);
	const [sortMode, setSortMode] = useState('newestThread');
	const [filteredLabels, setFilteredLabels] = useState<string[]>([]);

	const nonClosedDiscussions = discussions.filter((ds) => !ds.isClosed);

	const renderCenterItems = () => <SectionBullets>{nonClosedDiscussions.length}</SectionBullets>;

	// eslint-disable-next-line react/prop-types
	const renderIconItems = ({ isExpanded, iconColor }) => {
		if (isExpanded) {
			return (
				<React.Fragment>
					<Popover
						aria-label="Sort comments"
						preventBodyScroll={false}
						gutter={0}
						content={
							<SortList
								selected={sortMode}
								onSelect={(mode) => {
									setSortMode(mode);
								}}
							/>
						}
					>
						<AccentedIconButton
							accentColor={iconColor}
							aria-label="Sort comments"
							icon="sort"
						/>
					</Popover>
					<Popover
						aria-label="Filter comments"
						preventBodyScroll={false}
						gutter={0}
						content={
							<FilterMenu
								pubData={pubData}
								communityData={communityData}
								labelsData={pubData.labels || []}
								selectedLabels={filteredLabels}
								isManager={canManage}
								onBrowseArchive={setIsBrowsingArchive}
								isBrowsingArchive={isBrowsingArchive}
								onShowAnchoredComments={setShowingAnchoredComments}
								isShowingAnchoredComments={isShowingAnchoredComments}
								onLabelSelect={(labelId) => {
									const newFilteredLabels =
										filteredLabels.indexOf(labelId) > -1
											? filteredLabels.filter((id) => {
													return id !== labelId;
											  })
											: [...filteredLabels, labelId];
									setFilteredLabels(newFilteredLabels);
								}}
								updateLocalData={updateLocalData}
							/>
						}
						// @ts-expect-error ts-migrate(2322) FIXME: Type '{ children: Element; minimal: true; content:... Remove this comment to see the full error message
						close
					>
						<AccentedIconButton
							accentColor={iconColor}
							aria-label="Filter comments"
							icon="filter"
						/>
					</Popover>
					{userId && featureFlags.notifications && (
						<SubscriptionButton
							subscription={subscription}
							// @ts-ignore TODO(ian): Make updatePubData accept PubPageData
							onUpdateSubscription={(next) => updatePubData({ subscription: next })}
							target={{ pubId: pubData.id }}
							menuLabel="Follow Pub discussion"
						>
							<AccentedIconButton
								accentColor={iconColor}
								title="Manage subscription"
								icon="notifications"
							/>
						</SubscriptionButton>
					)}
					{canManage &&
						featureFlags.releaseDiscussionsDialog &&
						!isRelease &&
						discussions.length > 0 && (
							<DialogLauncher
								renderLauncherElement={({ openDialog }) => (
									<AccentedIconButton
										accentColor={iconColor}
										icon="share"
										title="Release Discussions"
										onClick={openDialog}
									/>
								)}
							>
								{({ isOpen, onClose, key }) => (
									<DiscussionsReleaseDialog
										key={key}
										isOpen={isOpen}
										onClose={onClose}
										pubData={pubData}
									/>
								)}
							</DialogLauncher>
						)}
				</React.Fragment>
			);
		}
		return null;
	};

	const createDiscussionFilter = (searchTerm) => (threads) => {
		const hiddenDiscussionIds = isShowingAnchoredComments
			? null
			: getAnchoredDiscussionIds(editorChangeObject!.view);
		const res = filterAndSortDiscussions(
			threads,
			isBrowsingArchive,
			sortMode,
			filteredLabels,
			searchTerm,
			hiddenDiscussionIds,
		);
		return res;
	};

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isSearchable={true}
			title="Comments"
			centerItems={renderCenterItems}
			iconItems={renderIconItems}
			defaultExpanded={true}
			searchPlaceholder="Search comments..."
		>
			{({ searchTerm, isSearching }) => (
				<PubDiscussions
					sideContentRef={sideContentRef}
					mainContentRef={mainContentRef}
					pubData={pubData}
					filterDiscussions={createDiscussionFilter(searchTerm)}
					searchTerm={searchTerm}
					showBottomInput={
						(canView || canCreateDiscussions) && !isSearching && !isBrowsingArchive
					}
				/>
			)}
		</PubBottomSection>
	);
};
export default DiscussionsSection;
