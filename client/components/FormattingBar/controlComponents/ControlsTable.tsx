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
	tableSetBreakoutSize,
	tableSplitCell,
	tableToggleHeaderCell,
	tableToggleHeaderColumn,
	tableToggleHeaderRow,
	tableToggleLabel,
	tableToggleSmallerFont,
} from 'components/Editor/commands';

import { CommandMenuEntry } from 'client/components/Editor/commands/types';
import CommandMenu, { CommandMenuDisclosureProps } from '../CommandMenu';

type Props = {
	editorChangeObject: EditorChangeObject;
	onClose: () => unknown;
};

const rowCommands: CommandMenuEntry[] = [
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

const columnCommands: CommandMenuEntry[] = [
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

const cellCommands: CommandMenuEntry[] = [
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
];

const wholeTableCommands: CommandMenuEntry[] = [
	{
		key: 'table-hide-label',
		title: 'Hide label',
		command: tableToggleLabel,
	},
	{
		key: 'table-toggle-smaller-font',
		title: 'Use smaller font',
		command: tableToggleSmallerFont,
	},
	{
		key: 'table-breakout-submenu',
		title: 'Breakout',
		icon: 'fullscreen',
		commands: [
			{
				key: 'table-no-breakout',
				title: 'Keep in column',
				command: tableSetBreakoutSize(null),
			},
			{
				key: 'table-breakout-50',
				title: 'Breakout: 50%',
				command: tableSetBreakoutSize(50),
			},
			{
				key: 'table-breakout-75',
				title: 'Breakout: 75%',
				command: tableSetBreakoutSize(75),
			},
			{
				key: 'table-breakout-100',
				title: 'Breakout: 100%',
				command: tableSetBreakoutSize(100),
			},
		],
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

	const renderDisclosure = (disclosureProps: CommandMenuDisclosureProps) => {
		const {
			disclosureElementProps: { ref, ...restProps },
		} = disclosureProps;
		return <Button minimal rightIcon="caret-down" elementRef={ref} icon="th" {...restProps} />;
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
				commands={[rowCommands, columnCommands, cellCommands, wholeTableCommands]}
				editorChangeObject={editorChangeObject}
				markActiveItems={false}
				{...toolbar}
			/>
		</Toolbar>
	);
};
export default ControlsTable;
