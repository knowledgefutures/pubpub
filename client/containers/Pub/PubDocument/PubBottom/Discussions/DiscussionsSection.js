import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { Popover, Position } from '@blueprintjs/core';

import { PageContext } from 'components/PageWrapper/PageWrapper';

import PubDiscussions from '../../PubDiscussions/PubDiscussions';
import PubBottomSection, { SectionBullets, AccentedIconButton } from '../PubBottomSection';
import SortList from './SortList';
import FilterMenu from './FilterMenu';
import { filterAndSortThreads } from '../../PubDiscussions/discussionUtils';

const propTypes = {
	pubData: PropTypes.shape({
		activeBranch: PropTypes.shape({
			id: PropTypes.string,
		}),
		discussions: PropTypes.arrayOf(PropTypes.shape({})),
		labels: PropTypes.arrayOf(PropTypes.shape({})),
		canManage: PropTypes.bool,
		canDiscussBranch: PropTypes.bool,
	}).isRequired,
	collabData: PropTypes.object.isRequired,
	firebaseBranchRef: PropTypes.object,
	updateLocalData: PropTypes.func.isRequired,
	sideContentRef: PropTypes.object.isRequired,
	mainContentRef: PropTypes.object.isRequired,
};

const defaultProps = {
	firebaseBranchRef: undefined,
};

const DiscussionsSection = (props) => {
	const { pubData, updateLocalData } = props;
	const { discussions } = pubData;
	const { communityData } = useContext(PageContext);
	const [isBrowsingArchive, setIsBrowsingArchive] = useState(false);
	const [isShowingAnchoredComments, setShowingAnchoredComments] = useState(true);
	const [sortMode, setSortMode] = useState('newestThread');
	const [filteredLabels, setFilteredLabels] = useState([]);

	const nonArchivedDiscussions = discussions.filter((ds) => !ds.isArchived);

	const renderCenterItems = () => (
		<SectionBullets>{nonArchivedDiscussions.length}</SectionBullets>
	);

	// eslint-disable-next-line react/prop-types
	const renderIconItems = ({ isExpanded, iconColor }) => {
		if (isExpanded) {
			return (
				<React.Fragment>
					<Popover
						minimal
						content={
							<SortList
								selected={sortMode}
								onSelect={(mode) => {
									setSortMode(mode);
								}}
							/>
						}
						position={Position.BOTTOM_RIGHT}
						transitionDuration={-1}
					>
						<AccentedIconButton
							accentColor={iconColor}
							icon="sort"
							title="Sort comments"
						/>
					</Popover>
					<Popover
						minimal
						content={
							<FilterMenu
								pubData={pubData}
								communityData={communityData}
								labelsData={pubData.labels || []}
								selectedLabels={filteredLabels}
								isManager={pubData.canManage}
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
						transitionDuration={-1}
						position={Position.BOTTOM_RIGHT}
						close
					>
						<AccentedIconButton
							accentColor={iconColor}
							icon="filter"
							title="Filter comments"
						/>
					</Popover>
				</React.Fragment>
			);
		}
		return null;
	};

	const createThreadFilter = (searchTerm) => (threads) => {
		const res = filterAndSortThreads(
			threads,
			isBrowsingArchive,
			sortMode,
			filteredLabels,
			pubData.activeBranch.id,
			searchTerm,
			isShowingAnchoredComments,
		);
		return res;
	};

	return (
		<PubBottomSection
			isSearchable={true}
			title="Comments"
			centerItems={renderCenterItems}
			iconItems={renderIconItems}
		>
			{({ searchTerm, isSearching }) => (
				<PubDiscussions
					{...props}
					filterThreads={createThreadFilter(searchTerm)}
					showBottomInput={pubData.canDiscussBranch && !isSearching && !isBrowsingArchive}
				/>
			)}
		</PubBottomSection>
	);
};

DiscussionsSection.propTypes = propTypes;
DiscussionsSection.defaultProps = defaultProps;
export default DiscussionsSection;
