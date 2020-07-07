export const getParentsAndChildrenForPub = ({
	inboundEdges,
	outboundEdges,
	allowUnapprovedRelationships,
}) => {
	const parents = [];
	const children = [];
	outboundEdges.forEach((edge) => {
		const { targetPub, targetExternalPublication, pubIsParent, relationType } = edge;
		(pubIsParent ? children : parents).push({
			relationType: relationType,
			...(targetPub && { pub: targetPub }),
			...(targetExternalPublication && { externalPublication: targetExternalPublication }),
		});
	});
	inboundEdges.forEach((edge) => {
		const { pub, pubIsParent, approvedByTarget, relationType } = edge;
		if (approvedByTarget || allowUnapprovedRelationships) {
			(pubIsParent ? parents : children).push({ relationType: relationType, pub: pub });
		}
	});
	return { parents: parents, children: children };
};
