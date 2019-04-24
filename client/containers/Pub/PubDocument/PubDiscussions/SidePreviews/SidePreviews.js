import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Popover, Position, ButtonGroup, PopoverInteractionKind } from '@blueprintjs/core';
import Preview from './Preview';

const propTypes = {
	threads: PropTypes.array.isRequired,
	groupData: PropTypes.object.isRequired,
	discussionsState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
	mainContentRef: PropTypes.object.isRequired,
	sideContentRef: PropTypes.object.isRequired,
};

require('./sidePreviews.scss');

const SidePreviews = (props) => {
	const {
		groupData,
		discussionsState,
		dispatch,
		threads,
		mainContentRef,
		sideContentRef,
	} = props;
	const [activeHighlightId, setActiveHighlightId] = useState(undefined);
	const groupIds = groupData.ids;
	if (!sideContentRef.current) {
		return null;
	}
	const mainWidth = mainContentRef.current.offsetWidth;
	const sideWidth = sideContentRef.current.offsetWidth;
	const left = (mainWidth + sideWidth) / 0.96 - sideWidth;

	const hasOneOpen = groupIds.reduce((prev, curr) => {
		const isOpen = discussionsState[curr] && discussionsState[curr].isOpen;
		if (isOpen) {
			return curr;
		}
		return false;
	}, false);
	if (hasOneOpen) {
		return (
			<div className="pub-discussions_side-previews" style={{ left: left, width: sideWidth }}>
				<style>{`.d-${hasOneOpen} { background-color: rgba(0, 0, 0, 0.2) !important; }`}</style>
				<Button
					icon="cross"
					minimal={true}
					onClick={() => {
						dispatch({
							id: hasOneOpen,
							key: 'isOpen',
							value: false,
						});
						setActiveHighlightId(undefined);
					}}
				/>
			</div>
		);
	}

	if (groupIds.length === 1) {
		const singleId = groupIds[0];
		return (
			<div className="pub-discussions_side-previews" style={{ left: left, width: sideWidth }}>
				{activeHighlightId && (
					<style>{`.d-${activeHighlightId} { background-color: rgba(0, 0, 0, 0.4) !important; }`}</style>
				)}
				<Preview
					threadData={threads.find((thread) => {
						return thread[0].id === singleId;
					})}
					isCollapsed={groupData.isCollapsed}
					dispatch={dispatch}
					discussionsState={discussionsState}
					setActiveHighlightId={setActiveHighlightId}
				/>
			</div>
		);
	}

	return (
		<div className="pub-discussions_side-previews" style={{ left: left, width: sideWidth }}>
			{activeHighlightId && (
				<style>{`.d-${activeHighlightId} { background-color: rgba(0, 0, 0, 0.4) !important; }`}</style>
			)}
			<Popover
				content={
					<ButtonGroup vertical={true} className="preview-button-group">
						{groupIds.map((id) => {
							return (
								<Preview
									key={id}
									threadData={threads.find((thread) => {
										return thread[0].id === id;
									})}
									isCollapsed={false}
									dispatch={dispatch}
									discussionsState={discussionsState}
									setActiveHighlightId={setActiveHighlightId}
								/>
							);
						})}
					</ButtonGroup>
				}
				target={
					<Button
						minimal={true}
						className="thread-group-target"
						text={`${groupIds.length} threads`}
					/>
				}
				minimal={true}
				usePortal={false}
				interactionKind={PopoverInteractionKind.HOVER}
				position={Position.BOTTOM_LEFT}
			/>
		</div>
	);
};

SidePreviews.propTypes = propTypes;
export default SidePreviews;
