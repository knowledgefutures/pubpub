import NotePopover from './NotePopover';
import ReferenceView from './ReferenceView';
import CodeView from './CodeView';

export default {
	citation: (node, view) => new NotePopover(node, view, 'unstructuredValue'),
	footnote: (node, view) => new NotePopover(node, view, 'value'),
	reference: (node, view) => new ReferenceView(node, view),
	code_block: (node, view, getPos) => new CodeView(node, view, getPos),
};
