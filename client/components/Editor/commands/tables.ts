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
import { createCommandSpec } from './util';

const toggleTableLabel: Command = (state: EditorState, dispatch?: Dispatch) => {
	const nodeLabels = getCurrentNodeLabels(state);
	if (!nodeLabels[ReferenceableNodeType.Table]?.enabled) {
		return false;
	}

	const table = findParentNodeClosestToPos(
		state.selection.$from,
		(node) => node.type.name === 'table',
	);

	if (table) {
		const transaction = state.tr.setNodeMarkup(table.pos, table.node.type, {
			...table.node.attrs,
			hideLabel: !table.node.attrs.hideLabel,
		});
		if (dispatch) {
			dispatch(transaction);
		}
		return true;
	}

	return false;
};

const createTableCommandSpec = (command: Command) => {
	return createCommandSpec((dispatch, state) => {
		const canRun = isInTable(state) && command(state);
		return {
			canRun,
			run: () => command(state, dispatch),
			isActive: false,
		};
	});
};

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
export const tableToggleLabel = createTableCommandSpec(toggleTableLabel);
