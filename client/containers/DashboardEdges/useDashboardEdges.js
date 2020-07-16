import { useState } from 'react';

import { usePendingChanges } from 'utils/hooks';
import { findRankInRankedList, sortByRank } from 'utils/rank';
import { apiFetch } from 'client/utils/apiFetch';

export const useDashboardEdges = (pubData) => {
	const [outboundEdges, setOutboundEdges] = useState(sortByRank(pubData.outboundEdges));
	const [inboundEdges, setInboundEdges] = useState(sortByRank(pubData.inboundEdges));
	const { pendingPromise } = usePendingChanges();

	const addCreatedOutboundEdge = (createdOutboundEdge) => {
		setOutboundEdges(sortByRank([...outboundEdges, createdOutboundEdge]));
	};

	const reorderOutboundEdges = (sourceIndex, destinationIndex) => {
		const nextOutboundEdges = [...outboundEdges];
		const [removed] = nextOutboundEdges.splice(sourceIndex, 1);
		const newRank = findRankInRankedList(nextOutboundEdges, destinationIndex);
		const updatedValue = {
			...removed,
			rank: newRank,
		};
		nextOutboundEdges.splice(destinationIndex, 0, updatedValue);
		pendingPromise(
			apiFetch.put('/api/pubEdges', {
				pubEdgeId: updatedValue.id,
				rank: newRank,
			}),
		);
		setOutboundEdges(nextOutboundEdges);
	};

	const removeOutboundEdge = (outboundEdge) => {
		pendingPromise(apiFetch.delete('/api/pubEdges', { pubEdgeId: outboundEdge.id }));
		setOutboundEdges(outboundEdges.filter((edge) => edge.id !== outboundEdge.id));
	};

	const updateInboundEdgeApproval = (inboundEdge, approvedByTarget) => {
		setInboundEdges(
			inboundEdges.map((edge) => {
				if (edge.id === inboundEdge.id) {
					return {
						...edge,
						approvedByTarget: approvedByTarget,
					};
				}
				return edge;
			}),
		);
		pendingPromise(
			apiFetch.put('/api/pubEdges/approvedByTarget', {
				pubEdgeId: inboundEdge.id,
				approvedByTarget: approvedByTarget,
			}),
		);
	};

	return {
		outboundEdges: outboundEdges,
		inboundEdges: inboundEdges,
		addCreatedOutboundEdge: addCreatedOutboundEdge,
		reorderOutboundEdges: reorderOutboundEdges,
		removeOutboundEdge: removeOutboundEdge,
		updateInboundEdgeApproval: updateInboundEdgeApproval,
	};
};
