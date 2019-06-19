/* eslint-disable no-console, no-restricted-syntax */
const { compressChange } = require('./changes');
const { reconstructDocument } = require('./reconstructDocument');

const stringMapToObj = (strMap, processValue) => {
	const res = {};
	for (const [key, value] of strMap) {
		const newKey = typeof key === 'number' ? (key - 1).toString() : key;
		res[newKey] = processValue ? processValue(value) : value;
	}
	return res;
};
class Branch {
	constructor(name, id) {
		this.name = name;
		this.id = id;
		this.merges = new Map();
		this.changes = new Map();
		this.discussions = new Map();
	}

	toString() {
		return `Branch(${this.name})`;
	}

	getNextKey() {
		return 1 + this.changes.size + this.merges.size;
	}

	addChange(change) {
		this.changes.set(this.getNextKey(), change);
	}

	addMerge(merge) {
		this.merges.set(this.getNextKey(), merge);
	}

	addDiscussion(discussionId, discussion) {
		this.discussions.set(discussionId, discussion);
	}

	getHighestMergeIndex() {
		return Math.max(...[-1, ...this.merges.keys()]);
	}

	getHighestChangeIndex() {
		return Math.max(...[-1, ...this.changes.keys()]);
	}

	getHighestIndex() {
		return Math.max(this.getHighestChangeIndex(), this.getHighestMergeIndex());
	}

	serialize() {
		const lastMergeKey = this.getHighestMergeIndex();
		return {
			id: this.id,
			changes: stringMapToObj(this.changes, compressChange),
			merges: stringMapToObj(this.merges, (changes) => changes.map(compressChange)),
			discussions: stringMapToObj(this.discussions),
			...(lastMergeKey !== -1 && { lastMergeKey: (lastMergeKey - 1).toString() }),
		};
	}

	*getIntermediateDocStates(optionalHighestIndex, withIndex) {
		const highestIndex = optionalHighestIndex || this.getHighestIndex();
		let intermediateDocument = null;
		for (let index = 1; index <= highestIndex; index += 1) {
			const changeAtIndex = this.changes.get(index);
			const mergeAtIndex = this.merges.get(index);
			if (changeAtIndex && mergeAtIndex) {
				throw new Error(`Branch has a merge and a change with the same index ${index}`);
			}
			if (!(changeAtIndex || mergeAtIndex)) {
				throw new Error(`Branch is missing an item at index ${index}`);
			}
			intermediateDocument = [
				...reconstructDocument(mergeAtIndex || [changeAtIndex], intermediateDocument),
			].slice(-1)[0];
			if (withIndex) {
				yield [index, intermediateDocument];
			} else {
				yield intermediateDocument;
			}
		}
	}

	getDocState(optionalHighestIndex) {
		return [...this.getIntermediateDocStates(optionalHighestIndex)].slice(-1)[0];
	}
}

module.exports = Branch;
