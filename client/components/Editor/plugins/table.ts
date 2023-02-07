import { keymap } from 'prosemirror-keymap';
import { DOMSerializer } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { columnResizing, tableEditing, goToNextCell } from 'prosemirror-tables';

import { TableView } from '../views';

function wrapDomSerializer(domSerializer: DOMSerializer) {
	return Object.assign(Object.create(domSerializer), {
		// Strip table captions when copying/pasting table elements.
		serializeFragment: function (fragment, options) {
			const result = domSerializer.serializeFragment(fragment, options);
			const tableCaptions = result.querySelectorAll('table > caption');

			tableCaptions.forEach((tableCaption) =>
				tableCaption.parentElement!.removeChild(tableCaption),
			);

			return result;
		},
	});
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
		// according to the docs, View accepts a NodeView constructor, not an instance.
		return [columnResizing({ handleWidth: -1, View: TableView })];
	}

	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
	document.execCommand('enableObjectResizing', false, false);
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'false' is not assignable to para... Remove this comment to see the full error message
	document.execCommand('enableInlineTableEditing', false, false);

	return [
		columnResizing({ View: TableView }),
		tableEditing(),
		keymap({
			Tab: goToNextCell(1),
			'Shift-Tab': goToNextCell(-1),
		}),
		new Plugin({
			props: { clipboardSerializer: wrapDomSerializer(DOMSerializer.fromSchema(schema)) },
		}),
	];
};
