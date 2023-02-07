import { tableNodes } from 'prosemirror-tables';
import { Fragment, Node as ProsemirrorNode } from 'prosemirror-model';

import { pruneFalsyValues } from 'utils/arrays';
import { withValue } from 'utils/fp';

import { counter } from './reactive/counter';
import { label } from './reactive/label';
import { buildLabel } from '../utils/references';

const pmTableNodes = tableNodes({
	tableGroup: 'block',
	cellContent: 'block+',
	cellAttributes: {
		background: {
			default: null,
			getFromDOM: (dom) => {
				// @ts-expect-error ts-migrate(2339) FIXME: Property 'style' does not exist on type 'Element'.
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

const { table } = pmTableNodes;

table.onInsert = (view) => {
	const numRows = 3;
	const numCols = 3;
	const { tr, schema } = view.state;
	const tableType = schema.nodes.table;
	const rowType = schema.nodes.table_row;
	const cellType = schema.nodes.table_cell;
	const cellNode = cellType.createAndFill({});
	const cells = [];
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
	for (let i = 0; i < numCols; i += 1) cells.push(cellNode);
	const rowNode = rowType.create(null, Fragment.from(cells));
	const rows = [];
	// @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'any' is not assignable to parame... Remove this comment to see the full error message
	for (let i = 0; i < numRows; i += 1) rows.push(rowNode);
	const tableNode = tableType.create(null, Fragment.from(rows));
	view.dispatch(tr.replaceSelectionWith(tableNode).scrollIntoView());
};

// Enhance table node with reactive attributes.
const { toDOM: tableToDOM } = table;

table.attrs = {
	...table.attrs,
	id: { default: null },
	hideLabel: { default: false },
	align: { default: null },
	size: { default: null },
	smallerFont: { default: false },
};
table.reactive = true;
table.reactiveAttrs = {
	count: counter({ useNodeLabels: true }),
	label: label(),
};

table.parseDOM![0].getAttrs = (node) => {
	return {
		id: (node as Element).getAttribute('id') || null,
	};
};

table.toDOM = (node: ProsemirrorNode) => {
	const { id, align, size, smallerFont } = node.attrs;
	const spec = tableToDOM!(node);
	const tableSpec = pruneFalsyValues([
		spec[0],
		withValue(buildLabel(node), (builtLabel) => ['caption', builtLabel]),
		spec[1],
	]);
	return [
		'div',
		{
			class: 'tableWrapper',
			id,
			'data-align': align,
			'data-size': size,
			'data-smaller-font': smallerFont,
		},
		tableSpec,
	];
};

export default pmTableNodes;
