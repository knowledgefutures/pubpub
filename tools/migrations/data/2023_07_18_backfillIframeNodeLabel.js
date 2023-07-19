import { facetModels } from 'server/models';
import { forEachInstance } from '../util';

export const up = async () => {
	const iframeNodeLabel = { enabled: false, text: 'Iframe' };
	await forEachInstance(
		facetModels.NodeLabels,
		async (nodeLabels) => {
			console.log(nodeLabels.id);
			await nodeLabels.update({ iframe: iframeNodeLabel });
		},
		10,
	);
};
