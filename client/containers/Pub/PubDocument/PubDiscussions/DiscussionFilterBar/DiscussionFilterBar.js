import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
	Popover,
	PopoverInteractionKind,
	Position,
	NonIdealState,
	Button,
} from '@blueprintjs/core';
import { filterAndSortThreads } from '../discussionUtils';
import SortList from './SortList';
import LabelsList from './LabelsList';

require('./discussionFilterBar.scss');

const propTypes = {
	pubData: PropTypes.object.isRequired,
	threadData: PropTypes.array.isRequired,
	children: PropTypes.func.isRequired,
};

const DiscussionFilterBar = (props) => {
	const { pubData, threadData, children } = props;
	const [isArchivedMode, setIsArchivedMode] = useState(false);
	const [sortMode, setSortMode] = useState('newestThread');
	const [filteredLabels, setFilteredLabels] = useState([]);

	const activeThreads = filterAndSortThreads(threadData, false, sortMode, filteredLabels);
	const archivedThreads = filterAndSortThreads(threadData, true, sortMode, filteredLabels);
	const filtersActive = !!filteredLabels.length;
	const threadsToRender = isArchivedMode ? archivedThreads : activeThreads;

	return (
		<div className="discussion-filter-bar-component">
			<div className="bar">
				<div className="left">
					<Button
						minimal
						active={!isArchivedMode}
						onClick={() => {
							setIsArchivedMode(false);
						}}
						text={`${activeThreads.length} Discussion${
							activeThreads.length === 1 ? '' : 's'
						}`}
					/>
					<Button
						minimal
						active={isArchivedMode}
						onClick={() => {
							setIsArchivedMode(true);
						}}
						text={`${archivedThreads.length} Archived`}
					/>
				</div>
				<div className="right">
					<Popover
						content={
							<LabelsList
								labelsData={pubData.labels || []}
								selectedLabels={filteredLabels}
								isManager={pubData.isManager}
								onLabelSelect={(labelId) => {
									const newFilteredLabels =
										filteredLabels.indexOf(labelId) > -1
											? filteredLabels.filter((id) => {
													return id !== labelId;
											  })
											: [...filteredLabels, labelId];
									setFilteredLabels(newFilteredLabels);
								}}
								// onLabelsUpdate={this.props.onLabelsSave}
								onLabelsUpdate={() => {}}
							/>
						}
						interactionKind={PopoverInteractionKind.CLICK}
						position={Position.BOTTOM_RIGHT}
						popoverClassName="bp3-minimal"
						transitionDuration={-1}
						inheritDarkTheme={false}
					>
						<div
							className={`bp3-button bp3-minimal ${
								filteredLabels.length ? 'active' : ''
							}`}
						>
							Labels
						</div>
					</Popover>
					<Popover
						content={
							<SortList
								selected={sortMode}
								onSelect={(mode) => {
									setSortMode(mode);
								}}
							/>
						}
						interactionKind={PopoverInteractionKind.CLICK}
						position={Position.BOTTOM_RIGHT}
						popoverClassName="bp3-minimal"
						transitionDuration={-1}
						inheritDarkTheme={false}
					>
						<Button minimal active={sortMode !== 'newestThread'} text="Sort" />
					</Popover>
				</div>
			</div>

			{!isArchivedMode && !activeThreads.length && (
				<NonIdealState
					title={filtersActive ? 'No Discussions Match Filter' : 'No Discussions Yet'}
					visual="bp3-icon-widget"
				/>
			)}

			{isArchivedMode && !archivedThreads.length && (
				<NonIdealState
					title={
						filtersActive
							? 'No Archived Discussions Match Filter'
							: 'No Archived Discussions'
					}
					visual="bp3-icon-widget"
				/>
			)}

			{children(threadsToRender)}
		</div>
	);
};

DiscussionFilterBar.propTypes = propTypes;
export default DiscussionFilterBar;
