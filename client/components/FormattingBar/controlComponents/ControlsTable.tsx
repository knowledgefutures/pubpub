import React, { useEffect } from 'react';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';
import { Button } from '@blueprintjs/core';

import { EditorChangeObject } from 'components/Editor';
import {
	tableAddColumnAfter,
	tableAddColumnBefore,
	tableAddRowAfter,
	tableAddRowBefore,
	tableDelete,
	tableDeleteColumn,
	tableDeleteRow,
	tableMergeCells,
	tableSplitCell,
	tableToggleHeaderCell,
	tableToggleHeaderColumn,
	tableToggleHeaderRow,
	tableToggleLabel,
} from 'components/Editor/commands';

import CommandMenu from '../CommandMenu';

type Props = {
	editorChangeObject: EditorChangeObject;
	onClose: () => unknown;
};

const rowCommands = [
	{
		key: 'table-add-row-before',
		title: 'Add row before',
		icon: 'add-row-top',
		command: tableAddRowBefore,
	},
	{
		key: 'table-add-row-after',
		title: 'Add row after',
		icon: 'add-row-bottom',
		command: tableAddRowAfter,
	},
	{
		key: 'table-toggle-header-row',
		title: 'Toggle header row',
		icon: 'page-layout',
		command: tableToggleHeaderRow,
	},
	{
		key: 'table-delete-row',
		title: 'Delete row',
		icon: 'disable',
		command: tableDeleteRow,
	},
];

const columnCommands = [
	{
		key: 'table-add-column-before',
		title: 'Add column before',
		icon: 'add-column-left',
		command: tableAddColumnBefore,
	},
	{
		key: 'table-add-column-after',
		title: 'Add column after',
		icon: 'add-column-right',
		command: tableAddColumnAfter,
	},
	{
		key: 'table-toggle-header-column',
		title: 'Toggle header column',
		icon: 'page-layout',
		command: tableToggleHeaderColumn,
	},
	{
		key: 'table-delete-column',
		title: 'Delete column',
		icon: 'disable',
		command: tableDeleteColumn,
	},
];

const buttonCommands = [
	{
		key: 'table-merge-cells',
		title: 'Merge cells',
		icon: 'merge-columns',
		command: tableMergeCells,
	},
	{
		key: 'table-split-cell',
		title: 'Split cell',
		icon: 'split-columns',
		command: tableSplitCell,
	},
	{
		key: 'toggle-header-cell',
		title: 'Toggle header cells',
		icon: 'header',
		command: tableToggleHeaderCell,
	},
	{
		key: 'table-toggle-label',
		title: 'Toggle label',
		icon: 'tag',
		command: tableToggleLabel,
	},
	{
		key: 'table-delete',
		title: 'Remove table',
		icon: 'trash',
		command: tableDelete,
	},
];

const ControlsTable = (props: Props) => {
	const { editorChangeObject, onClose } = props;
	const { view } = editorChangeObject;
	const toolbar = useToolbarState({ loop: true });

	const renderDisclosure = (_, { ref, ...disclosureProps }) => {
		return (
			<Button
				minimal
				rightIcon="caret-down"
				elementRef={ref}
				icon="th"
				{...disclosureProps}
			/>
		);
	};

	useEffect(() => {
		if (view) {
			view.dom.addEventListener('keydown', onClose);
			return () => view.dom.removeEventListener('keydown', onClose);
		}
		return () => {};
	}, [view, onClose]);

	return (
		<Toolbar {...toolbar} className="controls-table-component" aria-label="Table options">
			<ToolbarItem
				aria-label="Table options"
				as={CommandMenu as any}
				disclosure={renderDisclosure}
				commands={[rowCommands, columnCommands, buttonCommands]}
				editorChangeObject={editorChangeObject}
				markActiveItems={false}
				{...toolbar}
			/>
		</Toolbar>
	);
};
export default ControlsTable;
