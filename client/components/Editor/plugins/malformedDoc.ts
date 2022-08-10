import * as Sentry from '@sentry/browser';
import { Node } from 'prosemirror-model';
import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { collabDocPluginKey } from './collaborative';

const flattenKeys = (
	source: Record<string, any>,
	target: Record<string, any> = {},
	keyPrefix = '',
) => {
	Object.entries(source).forEach(([keySuffix, value]) => {
		const key = keyPrefix === '' ? keySuffix : `${keyPrefix}.${keySuffix}`;
		if (value && typeof value === 'object') {
			flattenKeys(value, target, key);
		} else {
			target[key] = value;
		}
	});
	return target;
};

const isMalformedDoc = (doc: Node) => {
	if (doc.childCount === 1) {
		const firstChild = doc.child(0);
		if (firstChild?.type.name === 'paragraph') {
			for (let i = 0; i < firstChild.childCount; i++) {
				const child = firstChild.child(i);
				if (child.type.name === 'paragraph') {
					return true;
				}
			}
		}
	}
	return false;
};

const getTransactionMetadata = (tr: Transaction, state: EditorState) => {
	const { steps, selection, mapping, docChanged, isGeneric } = tr;
	const { mostRecentRemoteKey } = collabDocPluginKey.getState(state);
	const meta = (tr as any).meta;
	return flattenKeys({
		meta,
		mostRecentRemoteKey,
		steps: steps.map((s) => s.toJSON()),
		selection: selection.toJSON(),
		mapping,
		docChanged,
		isGeneric,
	});
};

export default () => {
	let hasCaptured = false;

	return new Plugin({
		filterTransaction: (tr: Transaction, state: EditorState) => {
			const { doc } = tr;
			const isMalformed = isMalformedDoc(doc);
			if (isMalformed) {
				const transactionMetadata = getTransactionMetadata(tr, state);
				if (!hasCaptured) {
					hasCaptured = true;
					let theError: Error;
					try {
						throw new Error('Uh-oh!');
					} catch (err: any) {
						theError = err;
					}
					Sentry.captureEvent({
						message: 'Evil Prosemirror Transaction',
						contexts: { transactionMetadata, error: theError },
					});
				}
			}
			return !isMalformed;
		},
	});
};
