import { Button, Icon, Switch } from '@blueprintjs/core';
import classNames from 'classnames';
import React, { useState } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';

import { PubEdge } from 'types';
import { usePendingChanges } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { ConfirmDialog, DragDropListing, PubEdgeListingCard } from 'components';

import NewEdgeEditor from './NewEdgeEditor';

export type DashboardEdgesListingProps = {
	pubId: string;
	pubEdgeDescriptionIsVisible: boolean;
	onUpdateEdge?: (pubEdge: PubEdge) => unknown;
	onRemoveEdge?: (pubEdge: PubEdge) => unknown;
	onReorderEdges?: (idxA: number, idxB: number) => unknown;
	onUpdateEdgeApproval?: (pubEdge: PubEdge, approved: boolean) => unknown;
	isInbound: boolean;
	pubEdges: PubEdge[];
	renderEmptyState: () => React.ReactNode;
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

const DashboardEdgesListing = (props: DashboardEdgesListingProps) => {
	const {
		isInbound,
		onUpdateEdge = null,
		onRemoveEdge = null,
		onReorderEdges = null,
		onUpdateEdgeApproval = null,
		pubId,
		pubEdges,
		pubEdgeDescriptionIsVisible,
		renderEmptyState,
	} = props;
	const [editing, setEditing] = useState<PubEdge>();
	const { pendingPromise } = usePendingChanges();
	const [isCreatingEdge, setIsCreatingEdge] = useState(false);
	const [errorCreatingEdge, setErrorCreatingEdge] = useState<string>();

	const handleDragEnd = (dragResult) => {
		const { source, destination } = dragResult;
		if (onReorderEdges) {
			onReorderEdges(source.index, destination.index);
		}
	};

	const updatePubEdge = (edge: PubEdge) => {
		setIsCreatingEdge(true);
		pendingPromise(
			apiFetch.put('/api/pubEdges', {
				pubEdgeId: edge.id,
				...edge,
				pubId,
				// Don't send the whole Pub, just the ID
				targetPub: undefined,
			}),
		)
			.then((updatedEdge: PubEdge) => {
				setEditing(undefined);
				setIsCreatingEdge(false);
				onUpdateEdge?.(updatedEdge);
			})
			.catch((err: Error) => {
				setEditing(undefined);
				setIsCreatingEdge(false);
				setErrorCreatingEdge(err.message);
			});
	};

	const renderEdgeListing = (pubEdge: PubEdge, dragHandleProps, isDragging) => {
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
				{editing?.id === pubEdge.id ? (
					<NewEdgeEditor
						pubEdgeDescriptionIsVisible={pubEdgeDescriptionIsVisible}
						pubEdge={editing}
						usedPubIds={[]}
						onCancel={() => setEditing(undefined)}
						onChange={setEditing}
						onSave={updatePubEdge}
						saveButtonLabel="Save connection"
						loading={isCreatingEdge}
						error={errorCreatingEdge}
					/>
				) : (
					<PubEdgeListingCard
						pubEdgeDescriptionIsVisible={pubEdgeDescriptionIsVisible}
						pubEdge={pubEdge}
						isInboundEdge={isInbound}
						accentColor="#ccc"
					>
						{onUpdateEdge && (
							<Button
								onClick={() => setEditing(pubEdge)}
								outlined
								minimal
								icon="edit"
							>
								Edit
							</Button>
						)}
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
				)}
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

export default DashboardEdgesListing;
