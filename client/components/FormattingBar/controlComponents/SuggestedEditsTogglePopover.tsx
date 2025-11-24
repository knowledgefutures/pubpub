import React from 'react';

import { usePubContext } from 'client/containers/Pub/pubHooks';

import './suggestedEditsTogglePopover.scss';

export const SuggestedEditsTogglePopover = () => {
	const { inPub } = usePubContext();

	if (!inPub) {
		return null;
	}

	return (
		<p className="suggested-edits-toggle-popover-component">
			Editing the document in this mode will create suggestions.
		</p>
	);
};
