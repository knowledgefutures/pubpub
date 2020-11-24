import React, { useState } from 'react';
import { NonIdealState, Switch, Tab, Tabs, Radio } from '@blueprintjs/core';

import { DashboardFrame } from 'components';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { Pub, OutboundEdge, InboundEdge } from 'utils/types';

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
	pubData: Pub & { outboundEdges: OutboundEdge[]; inboundEdges: InboundEdge[] };
};

const frameDetails = (
	<>
		<p>
			Create & manage relationships between this Pub and other Pubs in your Community or
			publications elsewhere on the internet.
		</p>
		<p>Connection previews will be shown near the header and footer of this Pub's layout.</p>
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
	const [persistedPubData, setPersistedPubData] = useState(pubData);

	const {
		inboundEdges,
		outboundEdges,
		addCreatedOutboundEdge,
		reorderOutboundEdges,
		removeOutboundEdge,
		updateInboundEdgeApproval,
	} = useDashboardEdges(pubData);

	const updatePub = async (patch: Partial<Pub>) => {
		try {
			setPersistedPubData({ ...persistedPubData, ...patch });
			await apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					pubId: persistedPubData.id,
					...patch,
				}),
			});
		} catch {
			setPersistedPubData(persistedPubData);
		}
	};

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
						// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
						usedPubIds={usedPubsIds}
						pubData={persistedPubData}
						onCreateNewEdge={addCreatedOutboundEdge}
						onChangeCreatingState={(isCreating) =>
							setShowOutboundEmptyState(!isCreating)
						}
					/>
				)}
				<DashboardEdgesListing
					pubData={persistedPubData}
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
				pubData={persistedPubData}
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
			{canManageEdges && (
				<div className="default-settings">
					<div>
						<span>Show multiple Connections as:</span>
						<Radio
							checked={persistedPubData.pubEdgeListingDefaultsToCarousel}
							onChange={() => updatePub({ pubEdgeListingDefaultsToCarousel: true })}
							inline
						>
							Carousel
						</Radio>
						<Radio
							checked={!persistedPubData.pubEdgeListingDefaultsToCarousel}
							onChange={() => updatePub({ pubEdgeListingDefaultsToCarousel: false })}
							inline
						>
							List
						</Radio>
					</div>
					<div>
						<label>
							<Switch
								checked={persistedPubData.pubEdgeDescriptionVisible}
								onChange={(event) =>
									updatePub({
										pubEdgeDescriptionVisible: (event.target as HTMLInputElement)
											.checked,
									})
								}
								inline
							/>
							Show Description by default
						</label>
					</div>
				</div>
			)}
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
