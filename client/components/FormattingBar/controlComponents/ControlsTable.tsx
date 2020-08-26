import React, { useEffect } from 'react';
import { Toolbar, ToolbarItem, useToolbarState } from 'reakit';
import { Button } from '@blueprintjs/core';

import CommandMenu from '../CommandMenu';

type Props = {
	editorChangeObject: {
		view?: {
			dom?: any;
		};
	};
	onClose: (...args: any[]) => any;
};

const rowCommands = [
	{ key: 'table-add-row-before', title: 'Add row before', icon: 'add-row-top' },
	{ key: 'table-add-row-after', title: 'Add row after', icon: 'add-row-bottom' },
	{ key: 'table-toggle-header-row', title: 'Toggle header row', icon: 'page-layout' },
	{ key: 'table-delete-row', title: 'Delete row', icon: 'disable' },
];

const columnCommands = [
	{ key: 'table-add-column-before', title: 'Add column before', icon: 'add-column-left' },
	{ key: 'table-add-column-after', title: 'Add column after', icon: 'add-column-right' },
	{ key: 'table-toggle-header-column', title: 'Toggle column row', icon: 'page-layout' },
	{ key: 'table-delete-column', title: 'Delete column', icon: 'disable' },
];

const buttonCommands = [
	{ key: 'table-merge-cells', title: 'Merge cells', icon: 'merge-columns' },
	{ key: 'table-split-cell', title: 'Split cells', icon: 'split-columns' },
	{ key: 'toggle-header-cell', title: 'Toggle header cells', icon: 'header' },
	{ key: 'table-delete', title: 'Remove table', icon: 'trash' },
];

const ControlsTable = (props: Props) => {
	const { editorChangeObject, onClose } = props;
	const { view } = editorChangeObject;
	const toolbar = useToolbarState({ loop: true });

	// eslint-disable-next-line react/prop-types
	const renderDisclosure = ({ ref, ...disclosureProps }) => {
		return (
			<Button
				minimal
				className="block-type-selector-component"
				rightIcon="caret-down"
				elementRef={ref}
				icon="th"
				{...disclosureProps}
			/>
		);
	};

	useEffect(() => {
		// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
		view.dom.addEventListener('keydown', onClose);
		// @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
		return () => view.dom.removeEventListener('keydown', onClose);
	}, [view, onClose]);

	return (
		<Toolbar {...toolbar} className="controls-table-component" aria-label="Table options">
			{/* @ts-expect-error ts-migrate(2769) FIXME: Type 'ForwardRefExoticComponent<RefAttributes<unkn... Remove this comment to see the full error message */}
			<ToolbarItem
				aria-label="Table options"
				as={CommandMenu}
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
