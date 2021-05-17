import uuid from 'uuid';

import { ExternalPublication, PubEdge } from 'server/models';
import { indexByProperty } from 'utils/arrays';

import { forEachInstance } from '../util';

export const up = async () => {
	await forEachInstance(
		ExternalPublication,
		async (ep) => {
			ep.idNew = uuid.v4();
			await ep.save();
		},
		10,
	);
	const allExternalPublications = await ExternalPublication.findAll();
	const externalPublicationsById = indexByProperty(allExternalPublications, 'id');
	await forEachInstance(
		PubEdge,
		async (pubEdge) => {
			const { externalPublicationId } = pubEdge;
			if (externalPublicationId) {
				const ep = externalPublicationsById[externalPublicationId];
				if (!ep) {
					throw new Error(`Missing EP for ID ${externalPublicationId}`);
				}
				pubEdge.externalPublicationIdNew = ep.idNew;
				await pubEdge.save();
			}
		},
		10,
	);
};
