import React from 'react';
import PropTypes from 'prop-types';
import { Button, Icon, Switch } from '@blueprintjs/core';
import { DragDropContext } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { ConfirmDialog, DragDropListing, PubEdgeListingCard } from 'components';

const propTypes = {
	onRemoveEdge: PropTypes.func,
	onReorderEdges: PropTypes.func,
	onUpdateEdgeApproval: PropTypes.func,
	isInbound: PropTypes.bool.isRequired,
	pubEdges: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	renderEmptyState: PropTypes.func.isRequired,
};

const defaultProps = {
	onRemoveEdge: null,
	onReorderEdges: null,
	onUpdateEdgeApproval: null,
};

const renderRemoveEdgeButton = (callback) => {
	return (
		<ConfirmDialog
			onConfirm={callback}
			confirmLabel="Remove"
			text="Are you sure you want to remove this connection?"
		>
			{({ open }) => (
				<Button onClick={open} outlined minimal icon="small-cross">
					Remove
				</Button>
			)}
		</ConfirmDialog>
	);
};

const DashboardEdgesListing = (props) => {
	const {
		isInbound,
		onRemoveEdge,
		onReorderEdges,
		onUpdateEdgeApproval,
		pubEdges,
		renderEmptyState,
	} = props;

	const handleDragEnd = (dragResult) => {
		const { source, destination } = dragResult;
		if (onReorderEdges) {
			onReorderEdges(source.index, destination.index);
		}
	};

	const renderEdgeListing = (pubEdge, dragHandleProps, isDragging) => {
		const { approvedByTarget } = pubEdge;
		const renderAsNotApproved = !!onUpdateEdgeApproval && !approvedByTarget;
		return (
			<div
				className={classNames(
					'dashboard-edge-listing-item',
					isDragging && 'is-dragging',
					renderAsNotApproved && 'not-approved',
				)}
			>
				{onReorderEdges && (
					<div {...dragHandleProps} className="drag-handle">
						<Icon icon="drag-handle-vertical" />
					</div>
				)}
				<PubEdgeListingCard pubEdge={pubEdge} isInboundEdge={isInbound} accentColor="#ccc">
					{onRemoveEdge && renderRemoveEdgeButton(() => onRemoveEdge(pubEdge))}
					{onUpdateEdgeApproval && (
						<Switch
							className="parent-approval-switch"
							onChange={() => onUpdateEdgeApproval(pubEdge, !approvedByTarget)}
							checked={approvedByTarget}
							label="Show on this Pub"
						/>
					)}
				</PubEdgeListingCard>
			</div>
		);
	};

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<DragDropListing
				className="dashboard-edges-listing-component"
				disabled={!onReorderEdges}
				itemId={(item) => item.id}
				items={pubEdges}
				renderItem={renderEdgeListing}
				renderEmptyState={renderEmptyState}
				droppableId="dashboardEdges"
				droppableType="DASHBOARD_EDGE"
				withDragHandles={!!onReorderEdges}
			/>
		</DragDropContext>
	);
};

DashboardEdgesListing.propTypes = propTypes;
DashboardEdgesListing.defaultProps = defaultProps;
export default DashboardEdgesListing;
