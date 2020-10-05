import React, { useCallback, useMemo } from 'react';
import { Menu, MenuItem } from '@blueprintjs/core';

import SuggestionManager, {
	SuggestionManagerSuggesting,
} from 'client/utils/suggestions/suggestionManager';

import { buildLabel, NodeReference } from './utils';

require('./referenceFinder.scss');

export type ReferenceFinderProps = {
	blockNames: { [key: string]: string };
	references: ReadonlyArray<NodeReference>;
	activeReference?: NodeReference;
	onReferenceSelect: (reference: NodeReference) => unknown;
};

const ReferenceFinder = (props: ReferenceFinderProps) => {
	const { blockNames, references, activeReference, onReferenceSelect } = props;
	const menuItems = useMemo(
		() =>
			references.map((reference) => (
				<MenuItem
					key={reference.node.attrs.id}
					onClick={() => onReferenceSelect(reference)}
					icon={reference.icon}
					text={buildLabel(reference.node, blockNames[reference.node.type.name])}
					active={reference === activeReference}
				/>
			)),
		[references, activeReference],
	);

	return (
		<Menu className="reference-finder-component bp3-elevation-1">
			{menuItems.length > 0 ? menuItems : <MenuItem text="No references found" disabled />}
		</Menu>
	);
};

export default ReferenceFinder;
