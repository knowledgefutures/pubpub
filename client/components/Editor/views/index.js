import NotePopover from './NotePopover';

export default {
	citation: (node, view) => new NotePopover(node, view, 'unstructuredValue'),
	footnote: (node, view) => new NotePopover(node, view, 'value'),
};
