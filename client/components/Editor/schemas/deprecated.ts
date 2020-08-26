const deprecatedBlock = {
	group: 'block',
	toDOM: () => ['span'],
};

/* This are a legacy nodes. It would be great */
/* to go through and remove and instances of  */
/* these in live documents. */
export default {
	highlightQuote: deprecatedBlock,
	citationList: deprecatedBlock,
	footnoteList: deprecatedBlock,
};
