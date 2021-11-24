import React, { useState } from 'react';
import {
	NonIdealState,
	Switch,
	Tab,
	Tabs,
	Radio,
	RadioGroup,
	Callout,
	Intent,
} from '@blueprintjs/core';

import { apiFetch } from 'client/utils/apiFetch';
import { DashboardFrame } from 'components';
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
	const [persistedPubData, setPersistedPubData] = useState(pubData);
	const [newEdge, setNewEdge] = useState<PubEdge | null>(null);
	const { pendingPromise } = usePendingChanges();
	const [isCreatingEdge, setIsCreatingEdge] = useState(false);
	const [errorCreatingEdge, setErrorCreatingEdge] = useState<string>();
	const showOutboundEmptyState = !newEdge;

	const {
		inboundEdges,
		outboundEdges,
		addCreatedOutboundEdge,
		reorderOutboundEdges,
		updateOutboundEdge,
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
						pubData={persistedPubData}
						pubEdge={newEdge}
						onCancel={() => setNewEdge(null)}
						onSave={saveNewEdge}
						onChange={setNewEdge}
						loading={isCreatingEdge}
						error={errorCreatingEdge}
					/>
				)}
				<DashboardEdgesListing
					pubData={persistedPubData}
					pubEdges={outboundEdges}
					onUpdateEdge={canManageEdges && updateOutboundEdge}
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
			{canManageEdges && (
				<div className="default-settings">
					<RadioGroup
						inline
						className="carousel-radio"
						onChange={(evt) => {
							const isCarousel =
								(evt.target as HTMLInputElement).value === 'carousel';
							updatePub({ pubEdgeListingDefaultsToCarousel: isCarousel });
						}}
						selectedValue={
							persistedPubData.pubEdgeListingDefaultsToCarousel ? 'carousel' : 'list'
						}
						label="Show multiple Connections as:"
					>
						<Radio value="carousel">Carousel</Radio>
						<Radio value="list">List</Radio>
					</RadioGroup>
					<Switch
						inline
						label="Show Description by default"
						checked={persistedPubData.pubEdgeDescriptionVisible}
						onChange={(event) =>
							updatePub({
								pubEdgeDescriptionVisible: (event.target as HTMLInputElement)
									.checked,
							})
						}
					/>
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
