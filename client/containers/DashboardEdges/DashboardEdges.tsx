import React, { useState } from 'react';
import { NonIdealState, Tab, Tabs, Callout, Intent, Button } from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { useFacetsQuery } from 'client/utils/useFacets';
import { DashboardFrame, PopoverButton, FacetEditor } from 'components';
import { usePageContext, usePendingChanges } from 'utils/hooks';
import { getDashUrl } from 'utils/dashboard';
import { Pub, OutboundEdge, InboundEdge, PubEdge } from 'types';

import DashboardEdgesListing from './DashboardEdgesListing';
import NewEdgeEditor from './NewEdgeEditor';
import { useDashboardEdges } from './useDashboardEdges';

require('./dashboardEdges.scss');

type Props = {
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
	const { pubData } = props;
	const {
		scopeData: {
			activePermissions: { canManage: canManageEdges },
		},
	} = usePageContext();
	const [newEdge, setNewEdge] = useState<PubEdge | null>(null);
	const { pendingPromise } = usePendingChanges();
	const [isCreatingEdge, setIsCreatingEdge] = useState(false);
	const [errorCreatingEdge, setErrorCreatingEdge] = useState<string>();
	const showOutboundEmptyState = !newEdge;

	const { descriptionIsVisible } = useFacetsQuery((F) => F.PubEdgeDisplay);
	const {
		inboundEdges,
		outboundEdges,
		addCreatedOutboundEdge,
		reorderOutboundEdges,
		updateOutboundEdge,
		removeOutboundEdge,
		updateInboundEdgeApproval,
	} = useDashboardEdges(pubData);

	const saveNewEdge = (edge: PubEdge) => {
		setIsCreatingEdge(true);
		pendingPromise(
			apiFetch.post('/api/pubEdges', {
				...edge,
				pubId: pubData.id,
				// Don't send the whole Pub, just the ID
				targetPub: undefined,
			}),
		)
			.then((createdEdge: PubEdge) => {
				setNewEdge(null);
				setIsCreatingEdge(false);
				addCreatedOutboundEdge(createdEdge);
			})
			.catch((err: Error) => {
				setNewEdge(null);
				setIsCreatingEdge(false);
				setErrorCreatingEdge(err.message);
			});
	};

	const renderOutboundEdgesTab = () => {
		const usedPubsIds = [
			pubData.id,
			...pubData.outboundEdges
				.map((edge) => edge.targetPub && edge.targetPub.id)
				.filter((x): x is string => !!x),
		];
		return (
			<>
				{canManageEdges && (
					<NewEdgeEditor
						usedPubIds={usedPubsIds}
						pubEdgeDescriptionIsVisible={descriptionIsVisible}
						pubEdge={newEdge}
						onCancel={() => setNewEdge(null)}
						onSave={saveNewEdge}
						onChange={setNewEdge}
						loading={isCreatingEdge}
						error={errorCreatingEdge}
					/>
				)}
				<DashboardEdgesListing
					pubId={pubData.id}
					pubEdges={outboundEdges}
					pubEdgeDescriptionIsVisible={descriptionIsVisible}
					onUpdateEdge={canManageEdges ? updateOutboundEdge : undefined}
					onReorderEdges={canManageEdges ? reorderOutboundEdges : undefined}
					onRemoveEdge={canManageEdges ? removeOutboundEdge : undefined}
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
				pubId={pubData.id}
				pubEdges={inboundEdges}
				pubEdgeDescriptionIsVisible={descriptionIsVisible}
				onUpdateEdgeApproval={canManageEdges ? updateInboundEdgeApproval : undefined}
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

	const renderControls = () => {
		if (canManageEdges) {
			return (
				<PopoverButton
					aria-label="Edit look and feel of Connections"
					component={() => (
						<FacetEditor
							selfContained
							facetName="PubEdgeDisplay"
							description="You can find these options in Pub Settings, too."
						/>
					)}
				>
					<Button outlined icon="clean" rightIcon="caret-down">
						Look and Feel
					</Button>
				</PopoverButton>
			);
		}
		return null;
	};

	return (
		<DashboardFrame
			className="dashboard-edges-container"
			title="Connections"
			controls={renderControls()}
			details={
				<>
					{frameDetails}{' '}
					{canManageEdges && pubData.crossrefDepositRecord && (
						<Callout intent={Intent.WARNING} title="Redeposit Warning">
							This Pub has been deposited to Crossref. If you choose to update this
							Pub's connections, you will need to{' '}
							<a href={getDashUrl({ pubSlug: pubData.slug, mode: 'settings' })}>
								re-deposit the Pub
							</a>{' '}
							for the updated relationships to appear in Crossref.
						</Callout>
					)}
				</>
			}
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
