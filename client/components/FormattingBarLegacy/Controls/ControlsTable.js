import React from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import DropdownButton from 'components/DropdownButton/DropdownButton';

const propTypes = {
	menuItems: PropTypes.array.isRequired,
	isSmall: PropTypes.bool.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
};

const ControlsTable = (props) => {
	const commands = {};
	props.menuItems.forEach((menuItem) => {
		commands[menuItem.title] = menuItem;
	});

	return (
		<div className={`formatting-bar_controls-component ${props.isSmall ? 'small' : ''}`}>
			{!props.isSmall && <div className="separator" />}

			<DropdownButton label="Table" isMinimal={true} usePortal={false}>
				<Menu>
					<MenuDivider title="Rows" />
					<MenuItem
						text="Add Row Before"
						disabled={!commands['table-add-row-before'].isActive}
						onClick={() => {
							commands['table-add-row-before'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Add Row After"
						disabled={!commands['table-add-row-after'].isActive}
						onClick={() => {
							commands['table-add-row-after'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Toggle Header Row"
						disabled={!commands['table-toggle-header-row'].isActive}
						onClick={() => {
							commands['table-toggle-header-row'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Remove Row"
						disabled={!commands['table-delete-row'].isActive}
						onClick={() => {
							commands['table-delete-row'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuDivider title="Columns" />
					<MenuItem
						text="Add Column Before"
						disabled={!commands['table-add-column-before'].isActive}
						onClick={() => {
							commands['table-add-column-before'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Add Column After"
						disabled={!commands['table-add-column-after'].isActive}
						onClick={() => {
							commands['table-add-column-after'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Toggle Header Column"
						disabled={!commands['table-toggle-header-column'].isActive}
						onClick={() => {
							commands['table-toggle-header-column'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Remove Column"
						disabled={!commands['table-delete-column'].isActive}
						onClick={() => {
							commands['table-delete-column'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuDivider title="Cells" />
					<MenuItem
						text="Merge Cells"
						disabled={!commands['table-merge-cells'].isActive}
						onClick={() => {
							commands['table-merge-cells'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Split Cell"
						disabled={!commands['table-split-cell'].isActive}
						onClick={() => {
							commands['table-split-cell'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuItem
						text="Toggle Header Cell"
						disabled={!commands['table-toggle-header-cell'].isActive}
						onClick={() => {
							commands['table-toggle-header-cell'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
					<MenuDivider />
					<MenuItem
						text="Remove Table"
						disabled={!commands['table-delete'].isActive}
						onClick={() => {
							commands['table-delete'].run();
							props.editorChangeObject.view.focus();
						}}
					/>
				</Menu>
			</DropdownButton>
		</div>
	);
};

ControlsTable.propTypes = propTypes;
export default ControlsTable;
