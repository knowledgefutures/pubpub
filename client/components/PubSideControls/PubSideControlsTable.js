import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

const propTypes = {
	menuItems: PropTypes.array.isRequired,
};

const PubSideControlsTable = (props)=> {
	const commands = {};
	props.menuItems.forEach((menuItem)=> {
		commands[menuItem.title] = menuItem;
	});

	return (
		<div className="pub-side-controls-table-component">
			<div className="options-title">Table Details</div>

			{/*  Row Adjustment */}
			<div className="form-label first">
				Row
			</div>
			<div className="bp3-button-group bp3-fill">
				<Button
					disabled={!commands['table-add-row-before'].isActive}
					onClick={commands['table-add-row-before'].run}
					text="Add Above"
				/>
				<Button
					disabled={!commands['table-add-row-after'].isActive}
					onClick={commands['table-add-row-after'].run}
					text="Add Below"
				/>
			</div>
			<div className="bp3-button-group bp3-fill">
				<Button
					disabled={!commands['table-toggle-header-row'].isActive}
					onClick={commands['table-toggle-header-row'].run}
					text="Toggle Header"
				/>
				<Button
					disabled={!commands['table-delete-row'].isActive}
					onClick={commands['table-delete-row'].run}
					text="Delete"
				/>
			</div>

			{/*  Column Adjustment */}
			<div className="form-label">
				Column
			</div>
			<div className="bp3-button-group bp3-fill">
				<Button
					disabled={!commands['table-add-column-before'].isActive}
					onClick={commands['table-add-column-before'].run}
					text="Add Left"
				/>
				<Button
					disabled={!commands['table-add-column-after'].isActive}
					onClick={commands['table-add-column-after'].run}
					text="Add Right"
				/>
			</div>
			<div className="bp3-button-group bp3-fill">
				<Button
					disabled={!commands['table-toggle-header-column'].isActive}
					onClick={commands['table-toggle-header-column'].run}
					text="Toggle Header"
				/>
				<Button
					disabled={!commands['table-delete-column'].isActive}
					onClick={commands['table-delete-column'].run}
					text="Delete"
				/>
			</div>

			{/*  Cell Adjustment */}
			<div className="form-label">
				Cell
			</div>
			<div className="bp3-button-group bp3-fill">
				<Button
					disabled={!commands['table-merge-cells'].isActive}
					onClick={commands['table-merge-cells'].run}
					text="Merge Cells"
				/>
				<Button
					disabled={!commands['table-split-cell'].isActive}
					onClick={commands['table-split-cell'].run}
					text="Split Cell"
				/>
			</div>
			<div className="bp3-button-group bp3-fill">
				<Button
					disabled={!commands['table-toggle-header-cell'].isActive}
					onClick={commands['table-toggle-header-cell'].run}
					text="Toggle Header Cell"
				/>
			</div>

			{/*  Table Adjustment */}
			<div className="form-label">
				Table
			</div>
			<div className="bp3-button-group bp3-fill">
				<Button
					disabled={!commands['table-delete'].isActive}
					onClick={commands['table-delete'].run}
					text="Delete Table"
				/>
			</div>
		</div>
	);
};


PubSideControlsTable.propTypes = propTypes;
export default PubSideControlsTable;
