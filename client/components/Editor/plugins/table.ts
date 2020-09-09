import { keymap } from 'prosemirror-keymap';
// @ts-ignore
import { columnResizing, tableEditing, goToNextCell, TableView } from 'prosemirror-tables';

class PubTableView extends TableView {
	constructor(node, whatever) {
		super(node, whatever);
		this.syncId(node);
	}

	update(node) {
		const shouldUpdate = super.update(node);
		this.syncId(node);
		return shouldUpdate;
	}

	syncId(node) {
		((this as any) as { dom: HTMLElement }).dom.setAttribute('id', node.attrs.id);
	}
}

export default (schema, props) => {
	if (!schema.nodes.table) {
		return [];
	}
	if (props.isReadOnly) {
		/* 
			We pass in columnResizing() in readOnly mode because it is
			required to draw the columns at the correct width. prosemirror-table
			doesn't provide a way to draw the columsn width properly without also
			making them editable. By setting handleWidth to -1, it seems to make it
			impossible to drag the columns - so perhaps that (hack) is good enough.
			handleWidth does appear in the documentation, but is initialized in the code:
			https://github.com/ProseMirror/prosemirror-tables/blob/master/src/columnresizing.js#L10
		*/
		return [columnResizing({ handleWidth: -1, View: PubTableView })];
	}

	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
	document.execCommand('enableObjectResizing', false, false);
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
	document.execCommand('enableInlineTableEditing', false, false);
	return [
		columnResizing({
			View: PubTableView,
		}),
		tableEditing(),
		keymap({
			Tab: goToNextCell(1),
			'Shift-Tab': goToNextCell(-1),
		}),
	];
};
