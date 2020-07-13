import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { NonIdealState, Tab, Tabs } from '@blueprintjs/core';

import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';

import DashboardEdgesListing from './DashboardEdgesListing';
import NewEdgeEditor from './NewEdgeEditor';
import { useDashboardEdges } from './useDashboardEdges';

require('./dashboardEdges.scss');

const propTypes = {
	overviewData: PropTypes.shape({
		pubs: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
	}).isRequired,
	pubData: PropTypes.shape({
		id: PropTypes.string,
		outboundEdges: PropTypes.arrayOf(
			PropTypes.shape({
				targetPub: PropTypes.shape({
					id: PropTypes.string,
				}),
			}),
		),
	}).isRequired,
};

const frameDetails = (
	<>
		Manage relationships between this Pub and others Pubs in your Community or publications
		elsewhere on the internet.
	</>
);

const DashboardEdges = (props) => {
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
			...pubData.outboundEdges
				.map((edge) => edge.targetPub && edge.targetPub.id)
				.filter((x) => x),
		];
		return (
			<>
				{canManageEdges && (
					<NewEdgeEditor
						availablePubs={overviewData.pubs}
						usedPubIds={usedPubsIds}
						pubData={pubData}
						onCreateNewEdge={addCreatedOutboundEdge}
						onChangeCreatingState={(isCreating) =>
							setShowOutboundEmptyState(!isCreating)
						}
					/>
				)}
				<DashboardEdgesListing
					pubEdges={outboundEdges}
					onReorderEdges={canManageEdges && reorderOutboundEdges}
					onRemoveEdge={canManageEdges && removeOutboundEdge}
					isInbound={false}
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
				pubEdges={inboundEdges}
				onUpdateEdgeApproval={canManageEdges && updateInboundEdgeApproval}
				isInbound={true}
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

DashboardEdges.propTypes = propTypes;
export default DashboardEdges;
