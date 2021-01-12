import { Node } from 'prosemirror-model';

import { editorSchema } from '../firebaseAdmin';

export const getDocFromJson = (docJson: {}): Node => {
	return Node.fromJSON(editorSchema, docJson);
};
