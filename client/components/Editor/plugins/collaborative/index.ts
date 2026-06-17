import type { CollabState } from '@stepwisehq/prosemirror-collab-commit/collab-commit';

import { collab } from '@pitter-patter/collab-client';
import { type Plugin, PluginKey } from 'prosemirror-state';

import { generateHash } from 'utils/hashes';

import buildCursors from './cursors';
import buildDocument from './document';

export const collabDocPluginKey = new PluginKey('collaborative');

export default (schema, props) => {
	if (!props.collaborativeOptions) {
		return [];
	}

	const localClientId = `${props.collaborativeOptions.clientData.id}-${generateHash(6)}`;

	return [
		collab({
			version: props.collaborativeOptions.initialDocKey,
		}),
		//as unknown as Plugin<CollabState>,
		buildDocument(schema, props, collabDocPluginKey, localClientId),
		buildCursors(schema, props, collabDocPluginKey),
	];
};
