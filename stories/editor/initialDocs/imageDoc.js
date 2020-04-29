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
					marks: [{ type: 'strong' }],
				},
			],
		},
		{
			type: 'heading',
			attrs: {
				level: 1,
			},
			content: [
				{
					type: 'text',
					text: 'Introduction',
				},
			],
		},
		{
			type: 'image',
			attrs: {
				url: 'https://assets.pubpub.org/_testing/41517872250621.png',
				caption: 'Hello there!',
			},
		},
		{
			type: 'heading',
			attrs: {
				level: 2,
			},
			content: [
				{
					type: 'text',
					text: 'Whatever',
				},
			],
		},
		{
			type: 'heading',
			attrs: {
				level: 3,
			},
			content: [
				{
					type: 'text',
					text: 'Okay now',
				},
			],
		},
	],
};

export default doc;
