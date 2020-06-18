const iframeDoc = {
	type: 'doc',
	attrs: {
		meta: {},
	},
	content: [
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Hello there and hello.',
				},
			],
		},
		{
			type: 'iframe',
			attrs: {
				url: 'https://www.youtube.com/embed/RK1K2bCg4J8',
				caption: 'Hello there!',
			},
		},
	],
};

export default iframeDoc;
