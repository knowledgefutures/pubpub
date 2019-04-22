import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Popover, Position, Menu, MenuItem } from '@blueprintjs/core';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	groupIds: PropTypes.array.isRequired,
	discussionsState: PropTypes.object.isRequired,
	dispatch: PropTypes.func.isRequired,
};

require('./sidePreviews.scss');

const SidePreviews = (props) => {
	const { groupIds, discussionsState, dispatch } = props;
	const [activeHighlightId, setActiveHighlightId] = useState(undefined);
	const hasOneOpen = groupIds.reduce((prev, curr) => {
		const isOpen = discussionsState[curr] && discussionsState[curr].isOpen;
		if (isOpen) {
			return curr;
		}
		return false;
	}, false);
	if (hasOneOpen) {
		return (
			<div className="pub-discussions_side-previews">
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
					}}
				/>
			</div>
		);
	}

	if (groupIds.length === 1) {
		const singleId = groupIds[0];
		return (
			<div className="pub-discussions_side-previews">
				{activeHighlightId && (
					<style>{`.d-${activeHighlightId} { background-color: rgba(0, 0, 0, 0.4) !important; }`}</style>
				)}
				<Button
					text={singleId}
					onClick={() => {
						dispatch({
							id: singleId,
							key: 'isOpen',
							value: !(
								discussionsState[singleId] && discussionsState[singleId].isOpen
							),
						});
					}}
					onMouseEnter={() => {
						setActiveHighlightId(singleId);
					}}
					onMouseLeave={() => {
						setActiveHighlightId(undefined);
					}}
				/>
			</div>
		);
	}
	return (
		<div className="pub-discussions_side-previews">
			{activeHighlightId && (
				<style>{`.d-${activeHighlightId} { background-color: rgba(0, 0, 0, 0.4) !important; }`}</style>
			)}
			<Popover
				content={
					<Menu>
						{groupIds.map((id, index) => {
							const isOpen = discussionsState[id] && discussionsState[id].isOpen;
							return (
								<MenuItem
									key={id}
									text={index}
									onClick={() => {
										dispatch({
											id: id,
											key: 'isOpen',
											value: !isOpen,
										});
									}}
									onMouseEnter={() => {
										setActiveHighlightId(id);
									}}
									onMouseLeave={() => {
										setActiveHighlightId(undefined);
									}}
								/>
							);
						})}
					</Menu>
				}
				target={<Button text={groupIds.length} />}
				minimal={true}
				position={Position.BOTTOM_LEFT}
			/>
		</div>
	);
};

SidePreviews.propTypes = propTypes;
export default SidePreviews;
