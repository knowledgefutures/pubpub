const doc = {
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
			type: 'video',
			attrs: {
				url: 'http://techslides.com/demos/sample-videos/small.mp4',
				caption: 'Hello there!',
			},
		},
	],
};

export default doc;
