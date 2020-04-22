import { Node } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import { Step, Mapping } from 'prosemirror-transform';
import {
	compressSelectionJSON,
	uncompressSelectionJSON,
	uncompressStepJSON,
} from 'prosemirror-compress-pubpub';

import { getFirebaseDoc } from './firebaseDoc';

export const restoreDiscussionMaps = (firebaseRef, schema, useMergeSteps) => {
	/* This function looks at all the discussions and ensures */
	/* they have been mapped through all necessary steps */

	/* Get all discussions and find the oldest currentKey we */
	/* must map from */
	return firebaseRef
		.child('discussions')
		.once('value')
		.then((discussionsSnapshot) => {
			if (!discussionsSnapshot.val()) {
				throw new Error('No Discussions to map');
			}
			const discussions = discussionsSnapshot.val();
			const discussionsWithoutSelections = {};
			Object.keys(discussions).forEach((discussionKey) => {
				if (!discussions[discussionKey].initAnchor) {
					discussionsWithoutSelections[discussionKey] = discussions[discussionKey];
					delete discussions[discussionKey];
				}
			});
			const earliestKey = Object.values(discussions).reduce((prev, curr) => {
				if (Number(curr.currentKey) < prev) {
					return curr.currentKey;
				}
				return prev;
			}, Infinity);
			return [discussions, discussionsWithoutSelections, earliestKey];
		})
		.then(([discussions, discussionsWithoutSelections, earliestKey]) => {
			const getNewSteps = firebaseRef
				.child('changes')
				.orderByKey()
				.startAt(String(earliestKey + 1))
				.once('value');
			const getNewMerges = useMergeSteps
				? firebaseRef
						.child('merges')
						.orderByKey()
						.startAt(String(earliestKey + 1))
						.once('value')
				: { val: () => ({}) };
			const getStarterContent = getFirebaseDoc(firebaseRef, schema, earliestKey);
			return Promise.all([
				discussions,
				discussionsWithoutSelections,
				earliestKey,
				getNewSteps,
				getNewMerges,
				getStarterContent,
			]);
		})
		.then(
			([
				discussions,
				discussionsWithoutSelections,
				earliestKey,
				newStepsSnapshot,
				newMergesSnapshot,
				starterContent,
			]) => {
				const allChanges = {
					...newStepsSnapshot.val(),
					...newMergesSnapshot.val(),
				};
				/* Check if we are missing any keys - which can happen if steps */
				/* across a merge are needed, and we're calling from without */
				/* userMergeSteps (i.e. we're calling from clientside) */
				const isMissingKeys = Object.keys(allChanges)
					.sort((foo, bar) => {
						return Number(foo) - Number(bar);
					})
					.reduce((prev, curr, index, array) => {
						const isLastElement = index === array.length - 1;
						const nextElement = array[index + 1];
						if (!isLastElement && Number(curr) + 1 !== Number(nextElement)) {
							return true;
						}
						return prev;
					}, false);
				if (!Object.keys(allChanges).length) {
					// console.log('Hey - nothing to do!');
					return null;
				}
				if (isMissingKeys) {
					console.error('Keys are missing so we cannot restore discussion maps.');
					return null;
				}
				const newDiscussions = {};
				let currentDoc = Node.fromJSON(schema, starterContent.doc);
				let currentKey = earliestKey;

				Object.keys(discussions).forEach((discussionId) => {
					if (discussions[discussionId].currentKey === currentKey) {
						try {
							const thisSelection = Selection.fromJSON(
								currentDoc,
								uncompressSelectionJSON(discussions[discussionId].selection),
							);
							newDiscussions[discussionId] = {
								...discussions[discussionId],
								selection: thisSelection,
							};
						} catch (err) {
							console.warn(`Warning on ${discussionId}: ${err}`);
						}
					}
				});

				Object.keys(allChanges).forEach((changeKey) => {
					currentKey = changeKey;
					const changeVal = allChanges[changeKey];
					const uncompressedChangeArray = Array.isArray(changeVal)
						? changeVal
						: [changeVal];

					/* Extract steps at current changeKey */
					const currentSteps = [];
					uncompressedChangeArray.forEach((stepContent) => {
						const compressedStepsJSON = stepContent.s;
						const uncompressedSteps = compressedStepsJSON.map((compressedStepJSON) => {
							return Step.fromJSON(schema, uncompressStepJSON(compressedStepJSON));
						});
						currentSteps.push(...uncompressedSteps);
					});

					/* Update currentDoc with steps at current changeKey */
					const nextDoc = currentSteps.reduce((prev, curr) => {
						const stepResult = curr.apply(prev);
						if (stepResult.failed) {
							console.error('Failed with ', stepResult.failed);
						}
						return stepResult.doc;
					}, currentDoc);

					currentDoc = nextDoc;

					/* Map all discussions in newDiscussions */
					const currentStepMaps = currentSteps.map((step) => {
						return step.getMap();
					});
					const currentMapping = new Mapping(currentStepMaps);

					Object.keys(newDiscussions).forEach((discussionId) => {
						const prevSelection = newDiscussions[discussionId].selection;
						newDiscussions[discussionId].selection = prevSelection.map(
							currentDoc,
							currentMapping,
						);
					});

					/* Init discussions that were made at this currentDoc */
					Object.keys(discussions).forEach((discussionId) => {
						if (discussions[discussionId].currentKey === Number(currentKey)) {
							newDiscussions[discussionId] = {
								...discussions[discussionId],
								selection: Selection.fromJSON(
									currentDoc,
									uncompressSelectionJSON(discussions[discussionId].selection),
								),
							};
						}
					});
				});
				const restoredDiscussions = { ...discussionsWithoutSelections };
				Object.keys(newDiscussions).forEach((discussionId) => {
					const newDiscussion = newDiscussions[discussionId];
					restoredDiscussions[discussionId] = {
						...newDiscussion,
						currentKey: Number(currentKey),
						selection: compressSelectionJSON(newDiscussion.selection.toJSON()),
					};
				});
				return firebaseRef.child('discussions').set(restoredDiscussions);
			},
		)
		.catch((err) => {
			if (err.message === 'No Discussions to map') {
				return;
			}
			console.error(err);
		});
};
