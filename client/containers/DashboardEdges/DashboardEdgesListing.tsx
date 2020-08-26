import React from 'react';
import { Button, Icon, Switch } from '@blueprintjs/core';
import { DragDropContext } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { ConfirmDialog, DragDropListing, PubEdgeListingCard } from 'components';

type OwnProps = {
	onRemoveEdge?: (...args: any[]) => any;
	onReorderEdges?: (...args: any[]) => any;
	onUpdateEdgeApproval?: (...args: any[]) => any;
	isInbound: boolean;
	pubEdges: {}[];
	renderEmptyState: (...args: any[]) => any;
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

type Props = OwnProps & typeof defaultProps;

const DashboardEdgesListing = (props: Props) => {
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
			// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
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
				{/* @ts-expect-error ts-migrate(2746) FIXME: This JSX tag's 'children' prop expects a single ch... Remove this comment to see the full error message */}
				<PubEdgeListingCard pubEdge={pubEdge} isInboundEdge={isInbound} accentColor="#ccc">
					{/* @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures. */}
					{onRemoveEdge && renderRemoveEdgeButton(() => onRemoveEdge(pubEdge))}
					{onUpdateEdgeApproval && (
						<Switch
							className="parent-approval-switch"
							// @ts-expect-error ts-migrate(2349) FIXME: Type 'never' has no call signatures.
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
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				className="dashboard-edges-listing-component"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				disabled={!onReorderEdges}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(item: any) => any' is not assignable to typ... Remove this comment to see the full error message
				itemId={(item) => item.id}
				items={pubEdges}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(pubEdge: any, dragHandleProps: any, isDragg... Remove this comment to see the full error message
				renderItem={renderEdgeListing}
				renderEmptyState={renderEmptyState}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				droppableId="dashboardEdges"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
				droppableType="DASHBOARD_EDGE"
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
				withDragHandles={!!onReorderEdges}
			/>
		</DragDropContext>
	);
};
DashboardEdgesListing.defaultProps = defaultProps;
export default DashboardEdgesListing;
