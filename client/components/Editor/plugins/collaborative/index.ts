import { collab } from 'prosemirror-collab';
import { PluginKey } from 'prosemirror-state';

import { generateHash } from 'utils/hashes';

import buildCursors from './cursors';
import buildDocument from './document';

export const collabDocPluginKey = new PluginKey('collaborative');

export default (schema, props) => {
	if (!props.collaborativeOptions?.firebaseRef) {
		return [];
	}

	const localClientId = `${props.collaborativeOptions.clientData.id}-${generateHash(6)}`;

	return [
		collab({ clientID: localClientId }),
		buildDocument(schema, props, collabDocPluginKey, localClientId),
		buildCursors(schema, props, collabDocPluginKey),
	];
};
