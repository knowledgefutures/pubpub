import { tableNodes } from 'prosemirror-tables';
import { Fragment } from 'prosemirror-model';

const pmTableNodes = tableNodes({
	tableGroup: 'block',
	cellContent: 'block+',
	cellAttributes: {
		background: {
			default: null,
			getFromDOM: (dom) => {
				return dom.style.backgroundColor || null;
			},
			setDOMAttr: (value /* , attrs */) => {
				if (value) {
					/* eslint-disable-next-line no-param-reassign */
					// TODO(ian): figure out what we want to do here
					// attrs.style = `background-color: ${value}; ${attrs.style || ''}`;
				}
			},
		},
	},
});

pmTableNodes.table.onInsert = (view) => {
	const numRows = 3;
	const numCols = 3;
	const { tr, schema } = view.state;
	const tableType = schema.nodes.table;
	const rowType = schema.nodes.table_row;
	const cellType = schema.nodes.table_cell;
	const cellNode = cellType.createAndFill({});
	const cells = [];
	for (let i = 0; i < numCols; i += 1) cells.push(cellNode);
	const rowNode = rowType.create(null, Fragment.from(cells));
	const rows = [];
	for (let i = 0; i < numRows; i += 1) rows.push(rowNode);
	const tableNode = tableType.create(null, Fragment.from(rows));
	view.dispatch(tr.replaceSelectionWith(tableNode).scrollIntoView());
};

export default pmTableNodes;
