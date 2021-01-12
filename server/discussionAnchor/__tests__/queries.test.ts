/* global describe, it, expect, beforeAll */
import { modelize, setup } from 'stubstub';

import { buildSchema } from 'client/components/Editor';
import { Fragment, Node, Slice } from 'prosemirror-model';
import { TextSelection, EditorState } from 'prosemirror-state';
import { ReplaceStep, Step } from 'prosemirror-transform';

import {
	createOriginalDiscussionAnchor,
	createUpdatedDiscussionAnchorForNewSteps,
} from '../queries';

const models = modelize`
	Community {
		Pub {
			Discussion discussion {
				number: 1
                author: User {}
                Visibility {
                    access: "public"
                }
				Thread {}
			}
		}
	}
`;

setup(beforeAll, async () => {
	await models.resolve();
});

const schema = buildSchema();

const originalDoc = Node.fromJSON(schema, {
	type: 'doc',
	attrs: { meta: {} },
	content: [
		{
			type: 'paragraph',
			attrs: {},
			content: [{ type: 'text', text: 'The quick brown fox jumps over the lazy dog' }],
		},
	],
});

const initialSelection = TextSelection.create(originalDoc, 5, 7).toJSON();
const replaceStep1 = new ReplaceStep(1, 1, new Slice(Fragment.from(schema.text('Hey! ')), 0, 0));
const replaceStep2 = new ReplaceStep(1, 13, Slice.empty);

const applyStepsToDocument = (doc: Node, steps: Step[]) => {
	return steps.reduce((intermediateDoc, step) => {
		const { failed, doc: nextDoc } = step.apply(intermediateDoc);
		if (failed) {
			console.error(`Failed with: ${failed}`);
		}
		return nextDoc!;
	}, doc);
};

describe('createUpdatedDiscussionAnchorForNewSteps', () => {
	it('repeatedly updates an anchor for a discussion', async () => {
		const {
			discussion: { id: discussionId },
		} = models;
		const firstAnchor = await createOriginalDiscussionAnchor({
			discussionId: discussionId,
			historyKey: 1,
			selectionJson: initialSelection as any,
			originalText: 'foo',
		});
		expect(firstAnchor).toMatchObject({
			discussionId: discussionId,
			historyKey: 1,
			isOriginal: true,
			selection: { type: 'text', anchor: 5, head: 7 },
			originalText: 'foo',
		});
		// Shift the discussion over a bit
		const secondAnchor = await createUpdatedDiscussionAnchorForNewSteps(
			firstAnchor,
			originalDoc,
			applyStepsToDocument(originalDoc, [replaceStep1]),
			[replaceStep1],
			2,
		);
		expect(secondAnchor).toMatchObject({
			discussionId: discussionId,
			historyKey: 2,
			isOriginal: false,
			selection: { type: 'text', anchor: 10, head: 12 },
			originalText: 'foo',
		});
		expect(secondAnchor.discussionId).toEqual(discussionId);
		expect(secondAnchor.historyKey).toEqual(2);
		expect(secondAnchor.isOriginal).toEqual(false);
		expect(secondAnchor.selection).toEqual({ type: 'text', anchor: 10, head: 12 });
		// Now remove its selection entirely
		const thirdAnchor = await createUpdatedDiscussionAnchorForNewSteps(
			firstAnchor,
			originalDoc,
			applyStepsToDocument(originalDoc, [replaceStep2]),
			[replaceStep2],
			2,
		);
		expect(thirdAnchor).toMatchObject({
			discussionId: discussionId,
			historyKey: 2,
			isOriginal: false,
			selection: null,
			originalText: 'foo',
		});
		// Check whether we can still updates to an anchor with a null selection
		const fourthAnchor = await createUpdatedDiscussionAnchorForNewSteps(
			{ ...firstAnchor.toJSON(), selection: null },
			originalDoc,
			applyStepsToDocument(originalDoc, [replaceStep1]),
			[replaceStep2],
			2,
		);
		expect(fourthAnchor).toMatchObject({ historyKey: 2, selection: null, originalText: 'foo' });
	});
});
