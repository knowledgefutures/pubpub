export default {
	paragraph: {
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
						text: 'Welcome to my introduction! ',
					},
				],
			},
		],
	},
	emptyParagraph: {
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
						text: 'Welcome to my introduction! ',
					},
				],
			},
			{
				type: 'paragraph',
				content: [],
			},
			{
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'Welcome to my introduction! ',
					},
				],
			},
		],
	},
	blockquote: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'blockquote',
				content: [
					{
						type: 'paragraph',
						attrs: {
							class: null,
						},
						content: [
							{
								type: 'text',
								text:
									'This is a test it’s almost impossible to write into this pub…',
							},
						],
					},
					{
						type: 'paragraph',
						attrs: {
							class: null,
						},
						content: [
							{
								type: 'text',
								text: 'Awesome!',
							},
						],
					},
				],
			},
		],
	},
	horizontal_rule: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'horizontal_rule',
			},
		],
	},
	headings: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'heading',
				attrs: {
					level: 1,
					id: 'one',
				},
				content: [
					{
						type: 'text',
						text: 'One',
					},
				],
			},
			{
				type: 'heading',
				attrs: {
					level: 2,
					id: 'two',
				},
				content: [
					{
						type: 'text',
						text: 'Two',
					},
				],
			},
			{
				type: 'heading',
				attrs: {
					level: 3,
					id: 'three',
				},
				content: [
					{
						type: 'text',
						text: 'Three',
					},
				],
			},
			{
				type: 'heading',
				attrs: {
					level: 4,
					id: 'four',
				},
				content: [
					{
						type: 'text',
						text: 'Four',
					},
				],
			},
			{
				type: 'heading',
				attrs: {
					level: 5,
					id: 'five',
				},
				content: [
					{
						type: 'text',
						text: 'Five',
					},
				],
			},
			{
				type: 'heading',
				attrs: {
					level: 6,
					id: 'six',
				},
				content: [
					{
						type: 'text',
						text: 'Six',
					},
				],
			},
		],
	},
	ordered_list: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'ordered_list',
				attrs: {
					order: 1,
				},
				content: [
					{
						type: 'list_item',
						content: [
							{
								type: 'paragraph',
								attrs: {
									class: null,
								},
								content: [
									{
										type: 'text',
										text: 'First',
									},
								],
							},
						],
					},
					{
						type: 'list_item',
						content: [
							{
								type: 'paragraph',
								attrs: {
									class: null,
								},
								content: [
									{
										type: 'text',
										text: 'Second',
									},
								],
							},
						],
					},
					{
						type: 'list_item',
						content: [
							{
								type: 'paragraph',
								attrs: {
									class: null,
								},
								content: [
									{
										type: 'text',
										text: 'Third',
									},
								],
							},
						],
					},
				],
			},
		],
	},
	bullet_list: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'bullet_list',
				content: [
					{
						type: 'list_item',
						content: [
							{
								type: 'paragraph',
								attrs: {
									class: null,
								},
								content: [
									{
										type: 'text',
										text: 'First',
									},
								],
							},
						],
					},
					{
						type: 'list_item',
						content: [
							{
								type: 'paragraph',
								attrs: {
									class: null,
								},
								content: [
									{
										type: 'text',
										text: 'Second',
									},
								],
							},
						],
					},
					{
						type: 'list_item',
						content: [
							{
								type: 'paragraph',
								attrs: {
									class: null,
								},
								content: [
									{
										type: 'text',
										text: 'Third',
									},
								],
							},
						],
					},
				],
			},
		],
	},
	code_block: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'code_block',
				content: [
					{
						type: 'text',
						text: 'const x = true;',
					},
				],
			},
		],
	},
	hard_break: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Hello',
					},
					{
						type: 'hard_break',
					},
					{
						type: 'text',
						text: 'Next line',
					},
				],
			},
		],
	},
	em: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Emphasis ',
					},
					{
						type: 'text',
						marks: [
							{
								type: 'em',
							},
						],
						text: 'here',
					},
				],
			},
		],
	},
	strong: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Bold ',
					},
					{
						type: 'text',
						marks: [
							{
								type: 'strong',
							},
						],
						text: 'here',
					},
				],
			},
		],
	},
	link: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Link ',
					},
					{
						type: 'text',
						marks: [
							{
								type: 'link',
								attrs: {
									href: 'https://www.pubpub.org',
									title: null,
									target: null,
								},
							},
						],
						text: 'here',
					},
				],
			},
		],
	},
	sub: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Subscript ',
					},
					{
						type: 'text',
						marks: [
							{
								type: 'sub',
							},
						],
						text: 'here',
					},
				],
			},
		],
	},
	sup: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Superscript ',
					},
					{
						type: 'text',
						marks: [
							{
								type: 'sup',
							},
						],
						text: 'here',
					},
				],
			},
		],
	},
	strike: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Strikethrough ',
					},
					{
						type: 'text',
						marks: [
							{
								type: 'strike',
							},
						],
						text: 'here',
					},
				],
			},
		],
	},
	code: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				attrs: {
					class: null,
				},
				content: [
					{
						type: 'text',
						text: 'Code ',
					},
					{
						type: 'text',
						marks: [
							{
								type: 'code',
							},
						],
						text: 'here',
					},
				],
			},
		],
	},
	audio: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'audio',
				attrs: {
					url: 'http://www.noiseaddicts.com/samples_1w72b820/3819.mp3',
					caption: 'Hello <em>there</em>!',
					size: 50,
					align: 'left',
				},
			},
		],
	},
	citation: {
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
		],
	},
	footnote: {
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
						type: 'footnote',
						attrs: {
							value: 'This here is some text!',
							count: 1,
							structuredValue: 'fish',
							structuredHtml: '<b>Fish</b>',
							id: 'ah8f01je8ja7bfh1',
						},
					},
					{
						type: 'text',
						text: 'Hello, how are you?',
					},
				],
			},
		],
	},
	'inline-equation': {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'paragraph',
				content: [
					{
						type: 'equation',
						attrs: {
							value: '\\sum_ix^i',
							html:
								'<span class="katex"><span class="katex-mathml"><math><semantics><mrow><msub><mo>∑</mo><mi>i</mi></msub><msup><mi>x</mi><mi>i</mi></msup></mrow><annotation encoding="application/x-tex">sum_ix^i</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="strut" style="height:0.824664em;"></span><span class="strut bottom" style="height:1.124374em;vertical-align:-0.29971000000000003em;"></span><span class="base"><span class="mop"><span class="mop op-symbol small-op" style="position:relative;top:-0.0000050000000000050004em;">∑</span><span class="msupsub"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.16195399999999993em;"><span style="top:-2.40029em;margin-left:0em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mathit mtight">i</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:0.29971000000000003em;"></span></span></span></span></span><span class="mord"><span class="mord mathit">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.824664em;"><span style="top:-3.063em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mathit mtight">i</span></span></span></span></span></span></span></span></span></span></span>',
						},
					},
				],
			},
		],
	},
	'block-equation': {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'block_equation',
				attrs: {
					value: '\\sum_ix^i',
					html:
						'<span class="katex-display"><span class="katex"><span class="katex-mathml"><math><semantics><mrow><munder><mo>∑</mo><mi>i</mi></munder><msup><mi>x</mi><mi>i</mi></msup></mrow><annotation encoding="application/x-tex">\\sum_ix^i</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:2.327674em;vertical-align:-1.277669em;"></span><span class="mop op-limits"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.0500050000000003em;"><span style="top:-1.872331em;margin-left:0em;"><span class="pstrut" style="height:3.05em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mathdefault mtight">i</span></span></span><span style="top:-3.050005em;"><span class="pstrut" style="height:3.05em;"></span><span><span class="mop op-symbol large-op">∑</span></span></span></span><span class="vlist-s">​</span></span><span class="vlist-r"><span class="vlist" style="height:1.277669em;"><span></span></span></span></span></span><span class="mspace" style="margin-right:0.16666666666666666em;"></span><span class="mord"><span class="mord mathdefault">x</span><span class="msupsub"><span class="vlist-t"><span class="vlist-r"><span class="vlist" style="height:0.8746639999999999em;"><span style="top:-3.113em;margin-right:0.05em;"><span class="pstrut" style="height:2.7em;"></span><span class="sizing reset-size6 size3 mtight"><span class="mord mathdefault mtight">i</span></span></span></span></span></span></span></span></span></span></span></span>',
				},
			},
		],
	},
	file: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'file',
				attrs: {
					url: 'http://www.noiseaddicts.com/samples_1w72b820/3819.mp3',
					caption: 'Hello <em>there</em>!',
					fileName: 'myFile.txt',
					fileSize: '20138',
				},
			},
		],
	},
	iframe: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'iframe',
				attrs: {
					url: 'https://www.youtube.com/embed/RK1K2bCg4J8',
					caption: 'Hello <em>there</em>!',
					align: 'full',
					size: 50,
					height: 350,
				},
			},
		],
	},
	image: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'image',
				attrs: {
					url: 'https://assets.pubpub.org/_testing/41517872250621.png',
					caption: 'Hello <em>there</em>!',
					size: 50,
					align: 'left',
				},
			},
		],
	},
	video: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'video',
				attrs: {
					url: 'http://techslides.com/demos/sample-videos/small.mp4',
					caption: 'Most videos are <b>colorful</b> - but some are black and white.',
					size: 50,
					align: 'center',
				},
			},
		],
	},
	table: {
		type: 'doc',
		attrs: {
			meta: {},
		},
		content: [
			{
				type: 'table',
				content: [
					{
						type: 'table_row',
						content: [
							{
								type: 'table_header',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Info',
											},
										],
									},
								],
							},
							{
								type: 'table_header',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Contact',
											},
										],
									},
								],
							},
							{
								type: 'table_header',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Country',
											},
										],
									},
								],
							},
						],
					},
					{
						type: 'table_row',
						content: [
							{
								type: 'table_cell',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Alfreds Futterkiste',
											},
										],
									},
								],
							},
							{
								type: 'table_cell',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Maria Anders',
											},
										],
									},
								],
							},
							{
								type: 'table_cell',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Germany',
											},
										],
									},
								],
							},
						],
					},
					{
						type: 'table_row',
						content: [
							{
								type: 'table_cell',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Centro comercial Moctezuma',
											},
										],
									},
								],
							},
							{
								type: 'table_cell',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Francisco Chang',
											},
										],
									},
								],
							},
							{
								type: 'table_cell',
								attrs: {
									colspan: 1,
									rowspan: 1,
									colwidth: null,
									background: null,
								},
								content: [
									{
										type: 'paragraph',
										attrs: {
											class: null,
										},
										content: [
											{
												type: 'text',
												text: 'Mexico',
											},
										],
									},
								],
							},
						],
					},
				],
			},
		],
	},
};
