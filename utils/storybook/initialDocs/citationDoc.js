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
					text: 'Hello',
				},
				{
					text: 'And some paragraph text ',
					type: 'text',
				},
				{
					type: 'citation',
					attrs: {
						html:
							'<div class="csl-bib-body">\n  <div data-csl-entry-id="turnbaugh2006obesity" class="csl-entry">Turnbaugh, P. J., Ley, R. E., Mahowald, M. A., Magrini, V., Mardis, E. R., &#38; Gordon, J. I. (2006). An obesity-associated gut microbiome with increased capacity for energy harvest. <i>Nature</i>, <i>444</i>(7122), 1027–131.</div>\n</div>',
						count: 1,
						value:
							'@article{turnbaugh2006obesity,\n  title={An obesity-associated gut microbiome with increased capacity for energy harvest},\n  author={Turnbaugh, Peter J and Ley, Ruth E and Mahowald, Michael A and Magrini, Vincent and Mardis, Elaine R and Gordon, Jeffrey I},\n  journal={nature},\n  volume={444},\n  number={7122},\n  pages={1027--131},\n  year={2006},\n  publisher={Nature Publishing Group}\n}',
					},
				},
				{
					type: 'text',
					text: 'Hello, how are you?',
				},
			],
		},
		{
			type: 'heading',
			attrs: {
				level: 2,
			},
			content: [
				{
					type: 'text',
					text: 'Citation List',
				},
			],
		},
		{
			type: 'citationList',
			attrs: { listItems: [] },
		},
	],
};

export default doc;
