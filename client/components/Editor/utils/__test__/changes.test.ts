import { editFirebaseDraft } from 'stubstub';

import { editorSchema } from 'components/Editor';
import { getStepsInChangeRange } from '../changes';

describe('getStepsInChangeRange', () => {
	it('returns expected steps', async () => {
		const editor = await editFirebaseDraft();
		editor.transform((tr, schema) => {
			tr.insert(0, schema.text('Hello fellow human'));
			tr.insert(0, schema.text('Here are some steps'));
		});
		await editor.writeChange();
		editor.transform((tr, schema) => {
			tr.insert(10, schema.text('This is another step'));
			tr.insert(5, schema.text('Very cool'));
		});
		await editor.writeChange();
		editor.transform((tr, schema) => {
			tr.replaceRangeWith(0, 10, schema.text('Okay just one more'));
		});
		await editor.writeChange();
		const [zeroToTwo, negativeOneToTwo] = await Promise.all([
			getStepsInChangeRange(editor.getRef(), editorSchema, 0, 2),
			getStepsInChangeRange(editor.getRef(), editorSchema, -1, 2),
		]);
		expect(zeroToTwo).toEqual(negativeOneToTwo);
		expect(zeroToTwo).toMatchInlineSnapshot(`
		[
		  [
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Hello fellow human",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 0,
		    },
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Here are some steps",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 0,
		    },
		  ],
		  [
		    {
		      "from": 10,
		      "slice": {
		        "content": [
		          {
		            "text": "This is another step",
		            "type": "text",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 10,
		    },
		    {
		      "from": 5,
		      "slice": {
		        "content": [
		          {
		            "text": "Very cool",
		            "type": "text",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 5,
		    },
		  ],
		  [
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Okay just one more",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		        "openEnd": 1,
		      },
		      "stepType": "replace",
		      "to": 10,
		    },
		  ],
		]
	`);
		expect(await getStepsInChangeRange(editor.getRef(), editorSchema, 0, 0))
			.toMatchInlineSnapshot(`
		[
		  [
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Hello fellow human",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 0,
		    },
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Here are some steps",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 0,
		    },
		  ],
		]
	`);
		expect(await getStepsInChangeRange(editor.getRef(), editorSchema, 0, 1))
			.toMatchInlineSnapshot(`
		[
		  [
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Hello fellow human",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 0,
		    },
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Here are some steps",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 0,
		    },
		  ],
		  [
		    {
		      "from": 10,
		      "slice": {
		        "content": [
		          {
		            "text": "This is another step",
		            "type": "text",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 10,
		    },
		    {
		      "from": 5,
		      "slice": {
		        "content": [
		          {
		            "text": "Very cool",
		            "type": "text",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 5,
		    },
		  ],
		]
	`);
		expect(await getStepsInChangeRange(editor.getRef(), editorSchema, 1, 2))
			.toMatchInlineSnapshot(`
		[
		  [
		    {
		      "from": 10,
		      "slice": {
		        "content": [
		          {
		            "text": "This is another step",
		            "type": "text",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 10,
		    },
		    {
		      "from": 5,
		      "slice": {
		        "content": [
		          {
		            "text": "Very cool",
		            "type": "text",
		          },
		        ],
		      },
		      "stepType": "replace",
		      "to": 5,
		    },
		  ],
		  [
		    {
		      "from": 0,
		      "slice": {
		        "content": [
		          {
		            "attrs": {
		              "class": null,
		              "id": null,
		              "rtl": null,
		              "suggestionDiscussionId": null,
		              "suggestionId": null,
		              "suggestionKind": null,
		              "suggestionOriginalAttrs": null,
		              "suggestionTimestamp": null,
		              "suggestionUserId": null,
		              "textAlign": null,
		            },
		            "content": [
		              {
		                "text": "Okay just one more",
		                "type": "text",
		              },
		            ],
		            "type": "paragraph",
		          },
		        ],
		        "openEnd": 1,
		      },
		      "stepType": "replace",
		      "to": 10,
		    },
		  ],
		]
	`);
	});
});
