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
					text:
						'Hello, this is some text about a thing that we are typing. We have lots of words and some letters. Not many numbers though.',
				},
			],
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
					marks: [{ type: 'link', attrs: { href: 'hi' } }],
				},
				{
					type: 'text',
					text: ' bit of ',
				},
				{
					type: 'text',
					text: 'some',
					marks: [{ type: 'link', attrs: { href: 'hi2' } }],
				},
				{
					type: 'text',
					text: ' formatting',
				},
			],
		},
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text:
						'Hello, this is some text about a thing that we are typing. We have lots of words and some letters. Not many numbers though.',
				},
			],
		},
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text:
						'Other things talk about earthworms. Hello this is a new sentence. some text about a thing that we are typing. We have lots of words and some letters. Not many numbers though.',
				},
			],
		},
	],
};

export default doc;
