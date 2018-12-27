export const plainDoc = {
	type: 'doc',
	attrs: {
		'meta': {}
	},
	content: [
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Hello, this is some text about a thing that we are typing. We have lots of words and some letters. Not many numbers though.'
				},
			]
		},
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'With ',
				},
				{
					type: 'text',
					text: 'a',
					marks: [{ type: 'link', attrs: { href: "hi" } }],
				},
				{
					type: 'text',
					text: ' bit of ',
				},
				{
					type: 'text',
					text: 'some',
					marks: [{ type: 'link', attrs: { href: "hi2" } }],
				},
				{
					type: 'text',
					text: ' formatting',
				}
			]
		},
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Hello, this is some text about a thing that we are typing. We have lots of words and some letters. Not many numbers though.'
				},
			]
		},
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Other things talk about earthworms. Hello this is a new sentence. some text about a thing that we are typing. We have lots of words and some letters. Not many numbers though.'
				},
			]
		}
	]
};

export const imageDoc = {
	type: 'doc',
	attrs: {
		meta: {}
	},
	content: [
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Hello there and hello.',
					marks: [{ type: 'strong' }],
				}
			]
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
				}
			]
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
				}
			]
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
				}
			]
		},
	]
};
