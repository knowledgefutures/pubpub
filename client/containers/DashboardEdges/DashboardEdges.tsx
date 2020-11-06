import React, { useState } from 'react';
import { NonIdealState, Tab, Tabs } from '@blueprintjs/core';

import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';

import DashboardEdgesListing from './DashboardEdgesListing';
import NewEdgeEditor from './NewEdgeEditor';
import { useDashboardEdges } from './useDashboardEdges';

require('./dashboardEdges.scss');

type Props = {
	overviewData: {
		pubs: {
			id: string;
			title: string;
			avatar?: string;
		}[];
	};
	pubData: {
		id?: string;
		outboundEdges?: {
			targetPub?: {
				id?: string;
			};
		}[];
	};
};

const frameDetails = (
	<>
		Manage relationships between this Pub and others Pubs in your Community or publications
		elsewhere on the internet.
	</>
);

const DashboardEdges = (props: Props) => {
	const { overviewData, pubData } = props;
	const [showOutboundEmptyState, setShowOutboundEmptyState] = useState(true);
	const {
		scopeData: {
			activePermissions: { canManage: canManageEdges },
		},
	} = usePageContext();

	const {
		inboundEdges,
		outboundEdges,
		addCreatedOutboundEdge,
		reorderOutboundEdges,
		removeOutboundEdge,
		updateInboundEdgeApproval,
	} = useDashboardEdges(pubData);

	const renderOutboundEdgesTab = () => {
		const usedPubsIds = [
			pubData.id,
			// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
			...pubData.outboundEdges
				.map((edge) => edge.targetPub && edge.targetPub.id)
				.filter((x) => x),
		];
		return (
			<>
				{canManageEdges && (
					<NewEdgeEditor
						availablePubs={overviewData.pubs}
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
						usedPubIds={usedPubsIds}
						pubData={pubData}
						onCreateNewEdge={addCreatedOutboundEdge}
						onChangeCreatingState={(isCreating) =>
							setShowOutboundEmptyState(!isCreating)
						}
					/>
				)}
				<DashboardEdgesListing
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
					pubEdges={outboundEdges}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(sourceIndex: any, destinationIndex: any) =>... Remove this comment to see the full error message
					onReorderEdges={canManageEdges && reorderOutboundEdges}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(outboundEdge: any) => void' is not assignab... Remove this comment to see the full error message
					onRemoveEdge={canManageEdges && removeOutboundEdge}
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'false' is not assignable to type 'never'.
					isInbound={false}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '() => false | JSX.Element' is not assignable... Remove this comment to see the full error message
					renderEmptyState={() =>
						showOutboundEmptyState && (
							<NonIdealState
								icon="layout-auto"
								title="No connections yet"
								description={
									canManageEdges
										? 'Start typing above to add a new connection.'
										: 'Connections created from this Pub will appear here.'
								}
							/>
						)
					}
				/>
			</>
		);
	};

	const renderInboundEdgesTab = () => {
		return (
			<DashboardEdgesListing
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'.
				pubEdges={inboundEdges}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '(inboundEdge: any, approvedByTarget: any) =>... Remove this comment to see the full error message
				onUpdateEdgeApproval={canManageEdges && updateInboundEdgeApproval}
				// @ts-expect-error ts-migrate(2322) FIXME: Type 'true' is not assignable to type 'never'.
				isInbound={true}
				// @ts-expect-error ts-migrate(2322) FIXME: Type '() => JSX.Element' is not assignable to type... Remove this comment to see the full error message
				renderEmptyState={() => (
					<NonIdealState
						icon="layout-auto"
						title="No connections from other Pubs"
						description="When other authors add connections to this Pub, they will be listed here."
					/>
				)}
			/>
		);
	};

	return (
		<DashboardFrame
			className="dashboard-edges-container"
			title="Connections"
			details={frameDetails}
		>
			<Tabs id="pub-dashboard-connections-tabs">
				<Tab
					id="created-by-this-pub"
					panel={renderOutboundEdgesTab()}
					title="Created by this Pub"
				/>
				<Tab
					id="created-by-other-pubs"
					panel={renderInboundEdgesTab()}
					title="Created by other Pubs"
				/>
			</Tabs>
		</DashboardFrame>
	);
};
export default DashboardEdges;
