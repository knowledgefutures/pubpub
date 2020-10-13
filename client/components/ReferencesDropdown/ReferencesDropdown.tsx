import React from 'react';

import { NodeReference } from '../Editor/utils/references';
import { MenuButton, MenuItem } from '../Menu';

export type ReferencesDropdownProps = {
	references: ReadonlyArray<NodeReference>;
	selectedReference?: NodeReference | null;
	onSelect: (reference: NodeReference) => unknown;
};

const ReferencesDropdown = (props: ReferencesDropdownProps) => {
	const { references, selectedReference, onSelect } = props;
	const currentIcon = selectedReference ? selectedReference.icon : 'disable';
	const currentLabel = selectedReference
		? selectedReference.label
		: references.length
		? 'No referenced item'
		: 'No items to reference';

	console.log(references);

	return (
		<div className="controls-link-component">
			<MenuButton
				disabled={references.length === 0}
				aria-label="Select an item to reference"
				buttonContent={currentLabel}
				buttonProps={{
					rightIcon: 'chevron-down',
					minimal: true,
					icon: currentIcon,
				}}
			>
				{references.map((possibleTarget) => {
					const { icon, node, label } = possibleTarget;
					return (
						<MenuItem
							onClick={() => {
								onSelect(possibleTarget);
							}}
							key={node.attrs.id}
							active={Boolean(selectedReference && selectedReference.node === node)}
							text={label}
							icon={icon}
						/>
					);
				})}
			</MenuButton>
		</div>
	);
};

export default ReferencesDropdown;
