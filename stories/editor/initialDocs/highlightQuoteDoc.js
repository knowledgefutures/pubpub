const doc = {
	type: 'doc',
	attrs: { meta: {} },
	content: [
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Hello, this is some text about.',
				},
			],
		},
		{
			type: 'highlightQuote',
			attrs: {
				prefix: 'Well then that is it. ',
				exact: 'This is my highlight.',
				suffix: ' Surely this comes after.',
				id: 'initfakeid1',
			},
		},
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Other things talk about earthworms. ',
				},
			],
		},
	],
};

export default doc;
