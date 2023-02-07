import { Node } from 'prosemirror-model';
import { EditorState, Command } from 'prosemirror-state';
import {
	isInTable,
	deleteTable,
	mergeCells,
	splitCell,
	addRowBefore,
	addRowAfter,
	deleteRow,
	addColumnBefore,
	addColumnAfter,
	deleteColumn,
	toggleHeaderRow,
	toggleHeaderColumn,
	toggleHeaderCell,
} from 'prosemirror-tables';

import { ReferenceableNodeType } from '../types';
import { getCurrentNodeLabels, findParentNodeClosestToPos } from '../utils';
import { Dispatch } from './types';
import { cacheForEditorState, createCommandSpec } from './util';

const findCurrentTable = cacheForEditorState((state: EditorState) => {
	return findParentNodeClosestToPos(state.selection.$from, (node) => node.type.name === 'table');
});

const createTableCommandSpec = (command: Command, isActive?: (node: Node) => boolean) => {
	return createCommandSpec((dispatch, state) => {
		const currentTable = findCurrentTable(state);
		let canRun = false;
		try {
			canRun = isInTable(state) && command(state);
		} catch (_) {
			// Sometimes it seems that ProseMirror gets upset while calling setNodeMarkup on our
			// tables if they are the first node in the document. You can try this yourself by
			// removing this try/catch, adding a table to the beginning of a Pub, and clicking into
			// the table to get the hovering table controls. If that works fine, feel free to remove
			// this block!
		}
		return {
			canRun,
			run: () => command(state, dispatch),
			isActive: isActive && currentTable ? isActive(currentTable.node) : false,
		};
	});
};

export const tableToggleLabel = createTableCommandSpec(
	(state: EditorState, dispatch?: Dispatch) => {
		const nodeLabels = getCurrentNodeLabels(state);
		if (!nodeLabels[ReferenceableNodeType.Table]?.enabled) {
			return false;
		}
		const table = findCurrentTable(state);
		if (table) {
			const { tr } = state;
			tr.setNodeMarkup(table.pos, table.node.type, {
				...table.node.attrs,
				hideLabel: !table.node.attrs.hideLabel,
			});
			if (dispatch) {
				dispatch(tr);
			}
			return true;
		}
		return false;
	},
	(node) => node.attrs.hideLabel,
);

export const tableSetBreakoutSize = (size: null | number) => {
	return createTableCommandSpec(
		(state: EditorState, dispatch?: Dispatch) => {
			const table = findCurrentTable(state);
			const { tr } = state;
			if (table) {
				const newAttrs =
					typeof size === 'number'
						? { align: 'breakout', size }
						: { align: null, size: null };
				tr.setNodeMarkup(table.pos, null, {
					...table.node.attrs,
					...newAttrs,
				});
				if (dispatch) {
					dispatch(tr);
				}
				return true;
			}
			return false;
		},
		(node) => node.attrs.size === size,
	);
};

export const tableToggleSmallerFont = createTableCommandSpec(
	(state, dispatch) => {
		const table = findCurrentTable(state);
		const { tr } = state;
		if (table) {
			const { smallerFont: currentlySmallerFont } = table.node.attrs;
			tr.setNodeMarkup(table.pos, table.node.type, {
				...table.node.attrs,
				smallerFont: !currentlySmallerFont,
			});
			if (dispatch) {
				dispatch(tr);
			}
			return true;
		}
		return false;
	},
	(node) => node.attrs.smallerFont,
);

export const tableDelete = createTableCommandSpec(deleteTable);
export const tableMergeCells = createTableCommandSpec(mergeCells);
export const tableSplitCell = createTableCommandSpec(splitCell);

export const tableAddRowBefore = createTableCommandSpec(addRowBefore);
export const tableAddRowAfter = createTableCommandSpec(addRowAfter);
export const tableDeleteRow = createTableCommandSpec(deleteRow);

export const tableAddColumnBefore = createTableCommandSpec(addColumnBefore);
export const tableAddColumnAfter = createTableCommandSpec(addColumnAfter);
export const tableDeleteColumn = createTableCommandSpec(deleteColumn);

export const tableToggleHeaderRow = createTableCommandSpec(toggleHeaderRow);
export const tableToggleHeaderColumn = createTableCommandSpec(toggleHeaderColumn);
export const tableToggleHeaderCell = createTableCommandSpec(toggleHeaderCell);
