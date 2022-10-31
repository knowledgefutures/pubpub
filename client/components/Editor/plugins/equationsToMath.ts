import { Node } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

type Replacement = {
	pos: number;
	replacementNode: Node;
};

const equationsToMathPluginKey = new PluginKey('equations-to-math');

const getEquationTranslationTransactionForState = (editorState: EditorState) => {
	const pluginState = equationsToMathPluginKey.getState(editorState);
	if (pluginState.hasRun) {
		return null;
	}
	const transaction = editorState.tr;
	const replacements: Replacement[] = [];
	let mustReturnTransaction = false;
	const mathInlineType = editorState.schema.nodes.math_inline;
	const mathDisplayType = editorState.schema.nodes.math_display;
	editorState.doc.descendants((node, pos) => {
		const replacementNodeType =
			node.type.name === 'equation'
				? mathInlineType
				: node.type.name === 'block_equation'
				? mathDisplayType
				: null;
		if (replacementNodeType) {
			// There are some equation nodes floating around out there with node.attrs.value = ''
			// But Prosemirror does not permit text nodes containing the empty string.
			// So, as a hack, we replace '' with ' '
			const replacementValue = node.attrs.value === '' ? ' ' : node.attrs.value;
			const replacementNode = replacementNodeType.create(
				null,
				editorState.schema.text(replacementValue),
			);
			replacements.push({ pos, replacementNode });
			mustReturnTransaction = true;
		}
	});
	if (mustReturnTransaction) {
		transaction.setMeta(equationsToMathPluginKey, true);
		replacements
			.reverse()
			.forEach(({ pos, replacementNode }) =>
				transaction.replaceWith(pos, pos + 1, replacementNode),
			);
		return transaction;
	}
	return null;
};

export default (_, props) => {
	if (props.isReadOnly) {
		return [];
	}
	return new Plugin({
		key: equationsToMathPluginKey,
		view: (editorView: EditorView) => {
			const transaction = getEquationTranslationTransactionForState(editorView.state);
			if (transaction) {
				editorView.dispatch(transaction);
			}
			return {};
		},
		appendTransaction: (__, ___, newState) =>
			getEquationTranslationTransactionForState(newState),
		state: {
			init: () => {
				return { hasRun: false };
			},
			apply: (transaction: Transaction, { hasRun }) => {
				return { hasRun: transaction.getMeta(equationsToMathPluginKey) || hasRun };
			},
		},
	});
};
