import React from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';

const propTypes = {
	menuItems: PropTypes.array.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

const FormattingBarControlsTable = (props)=> {
	const commands = {};
	props.menuItems.forEach((menuItem)=> {
		commands[menuItem.title] = menuItem;
	});
	const iconSize = props.isSmall ? 12 : 16;

	return (
		<div className={`formatting-bar-controls-component ${props.isSmall ? 'small' : ''}`}>
			{/*  Row Adjustment */}
			<div className="block">
				<div className="label over-buttons">Row</div>
				<div className="input">
					<Button
						disabled={!commands['table-add-row-before'].isActive}
						onClick={commands['table-add-row-before'].run}
						icon={<Icon icon="add-row-top" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-add-row-after'].isActive}
						onClick={commands['table-add-row-after'].run}
						icon={<Icon icon="add-row-bottom" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-toggle-header-row'].isActive}
						onClick={commands['table-toggle-header-row'].run}
						icon={<Icon icon="th-list" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-delete-row'].isActive}
						onClick={commands['table-delete-row'].run}
						icon={<Icon icon="delete" iconSize={iconSize} />}
						minimal={true}
					/>
				</div>
			</div>

			{/*  Column Adjustment */}
			<div className="block">
				<div className="label over-buttons">Column</div>
				<div className="input">
					<Button
						disabled={!commands['table-add-column-before'].isActive}
						onClick={commands['table-add-column-before'].run}
						icon={<Icon icon="add-column-left" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-add-column-after'].isActive}
						onClick={commands['table-add-column-after'].run}
						icon={<Icon icon="add-column-right" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-toggle-header-column'].isActive}
						onClick={commands['table-toggle-header-column'].run}
						icon={<Icon icon="th-list" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-delete-column'].isActive}
						onClick={commands['table-delete-column'].run}
						icon={<Icon icon="delete" iconSize={iconSize} />}
						minimal={true}
					/>
				</div>
			</div>

			{/*  Cell Adjustment */}
			<div className="block">
				<div className="label over-buttons">Cell</div>
				<div className="input">
					<Button
						disabled={!commands['table-merge-cells'].isActive}
						onClick={commands['table-merge-cells'].run}
						icon={<Icon icon="merge-columns" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-split-cell'].isActive}
						onClick={commands['table-split-cell'].run}
						icon={<Icon icon="split-columns" iconSize={iconSize} />}
						minimal={true}
					/>
					<Button
						disabled={!commands['table-toggle-header-cell'].isActive}
						onClick={commands['table-toggle-header-cell'].run}
						icon={<Icon icon="th-list" iconSize={iconSize} />}
						minimal={true}
					/>
				</div>
			</div>

			{/*  Table Adjustment */}
			<div className="block">
				<div className="label over-buttons">Table</div>
				<div className="input">
					<Button
						disabled={!commands['table-delete'].isActive}
						onClick={commands['table-delete'].run}
						icon={<Icon icon="delete" iconSize={iconSize} />}
						minimal={true}
					/>
				</div>
			</div>
		</div>
	);
};


FormattingBarControlsTable.propTypes = propTypes;
export default FormattingBarControlsTable;
