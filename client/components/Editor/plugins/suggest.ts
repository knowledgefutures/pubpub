import { suggest, Suggester } from 'prosemirror-suggest';
import { EditorView } from 'prosemirror-view';

import SuggestionManager from 'client/utils/suggestions/suggestionManager';
import { getReferenceableNodes, buildLabel, NodeReference } from 'components/Editor/utils';
import { Schema } from 'prosemirror-model';

type SuggestPluginProps = {
	blockNames: { [key: string]: string };
	suggestionManager: SuggestionManager<NodeReference>;
};

const normalizeQuery = (text: string) => text.toLowerCase().replace(/\s+/g, '');

export default (schema: Schema, props: SuggestPluginProps) => {
	const { blockNames, suggestionManager } = props;

	function getNodeReferences(view: EditorView, query: string) {
		const referenceableNodes = getReferenceableNodes(view.state);

		if (query === '') {
			return referenceableNodes;
		}

		return referenceableNodes.filter((target) => {
			const label = buildLabel(target.node, blockNames[target.node.type.name]);

			if (label === null) {
				return false;
			}

			return normalizeQuery(label).indexOf(normalizeQuery(query)) > -1;
		});
	}

	const suggester: Suggester = {
		char: '@',
		name: 'reference-suggestion',
		keyBindings: {
			ArrowUp: () => {
				suggestionManager.previous();
				return true;
			},
			ArrowDown: () => {
				suggestionManager.next();
				return true;
			},
			Enter: () => {
				suggestionManager.select();
				return true;
			},
			Esc: () => {
				suggestionManager.close();
				return true;
			},
		},
		onChange: (params) => {
			suggestionManager.load(
				getNodeReferences(params.view, params.queryText.partial),
				params,
			);
		},
		onExit: () => {
			suggestionManager.close();
		},
		createCommand: ({ match, view }) => {
			const command = (reference: NodeReference) => {
				const tr = view.state.tr;
				const { from, end: to } = match.range;
				const referenceNode = view.state.schema.nodes.reference.create({
					targetId: reference.node.attrs.id,
				});

				tr.replaceWith(from, to, referenceNode);

				view.dispatch(tr);
			};

			return command;
		},
	};

	const plugin = suggest(suggester);

	return plugin;
};
