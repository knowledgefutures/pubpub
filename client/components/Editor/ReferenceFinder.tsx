import type { NodeLabelMap } from './types';

import React, { useMemo } from 'react';

import { Classes, Menu, MenuItem } from '@blueprintjs/core';

import { buildLabel, getNodeLabelText, type NodeReference } from './utils';

import './referenceFinder.scss';

export type ReferenceFinderProps = {
	nodeLabels: NodeLabelMap;
	references: ReadonlyArray<NodeReference>;
	activeReference: NodeReference | null;
	onReferenceSelect: (reference: NodeReference) => unknown;
};

const ReferenceFinder = (props: ReferenceFinderProps) => {
	const { nodeLabels, references, activeReference, onReferenceSelect } = props;
	const menuItems = useMemo(
		() =>
			references.map((reference) => (
				<MenuItem
					key={reference.node.attrs.id}
					onClick={() => onReferenceSelect(reference)}
					icon={reference.icon}
					text={buildLabel(reference.node, getNodeLabelText(reference.node, nodeLabels))}
					active={reference === activeReference}
				/>
			)),

		[references, activeReference],
	);

	return (
		<Menu className={`reference-finder-component ${Classes.ELEVATION_1}`}>
			{menuItems.length > 0 ? menuItems : <MenuItem text="No items to reference" disabled />}
		</Menu>
	);
};

export default ReferenceFinder;
