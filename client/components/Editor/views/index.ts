import NotePopover from './NotePopover';
import ReferenceView from './ReferenceView';

export { TableView } from './TableView';

export default {
	citation: (node, view) => new NotePopover(node, view, 'unstructuredValue'),
	footnote: (node, view) => new NotePopover(node, view, 'value'),
	reference: (node, view) => new ReferenceView(node, view),
};
