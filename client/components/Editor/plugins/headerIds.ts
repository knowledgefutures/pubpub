import { Plugin } from 'prosemirror-state';

/* This plugin adds an id attribute to each header node. */
/* This id can be used for in-page routing. */
export default (_, props) => {
	if (props.isReadOnly) {
		return [];
	}
	return new Plugin({
		appendTransaction: (transactions, oldState, newState) => {
			const transaction = newState.tr;
			let changedId = false;
			newState.doc.forEach((node, offset) => {
				if (node.type.name === 'heading') {
					const newId = node.textContent
						.replace(/[^a-zA-Z0-9-\s]/gi, '')
						.replace(/^\d+\W+/gi, '')
						.replace(/\s+/gi, ' ')
						.trim()
						.toLowerCase()
						.replace(/\s/gi, '-');
					if (!node.attrs.fixedId && node.attrs.id !== newId) {
						changedId = true;
						transaction.setNodeMarkup(
							offset,
							node.type,
							{
								...node.attrs,
								id: newId,
							},
							node.marks,
						);
					}
				}
			});
			return changedId ? transaction : null;
		},
	});
};
