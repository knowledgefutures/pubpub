import { keymap } from 'prosemirror-keymap';
import { columnResizing, tableEditing, goToNextCell } from 'prosemirror-tables';

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
		return [columnResizing({ handleWidth: -1 })];
	}

	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
	document.execCommand('enableObjectResizing', false, false);
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
	document.execCommand('enableInlineTableEditing', false, false);
	return [
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
		columnResizing(),
		tableEditing(),
		keymap({
			Tab: goToNextCell(1),
			'Shift-Tab': goToNextCell(-1),
		}),
	];
};
