import React from 'react';

import { buildLabel, NodeReference } from '../Editor/utils/references';
import { MenuButton, MenuItem } from '../Menu';

export type ReferencesDropdownProps = {
	references: ReadonlyArray<NodeReference>;
	blockNames: { [key: string]: string };
	selectedReference?: NodeReference | null;
	onSelect: (reference: NodeReference) => unknown;
};

const ReferencesDropdown = (props: ReferencesDropdownProps) => {
	const { blockNames, references, selectedReference, onSelect } = props;
	const currentIcon = selectedReference ? selectedReference.icon : 'disable';
	const currentLabel = selectedReference
		? buildLabel(selectedReference.node, blockNames[selectedReference.node.type.name])
		: references.length
		? 'No referenced item'
		: 'No items to reference';

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
					const { icon, node } = possibleTarget;
					return (
						<MenuItem
							onClick={() => {
								onSelect(possibleTarget);
							}}
							key={node.attrs.id}
							active={Boolean(selectedReference && selectedReference.node === node)}
							text={buildLabel(node, blockNames[node.type.name])}
							icon={icon}
						/>
					);
				})}
			</MenuButton>
		</div>
	);
};

export default ReferencesDropdown;
