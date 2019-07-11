/* eslint-disable no-console, no-restricted-syntax */
const { compressChange } = require('./changes');
const { reconstructDocument } = require('./reconstructDocument');

const stringMapToObj = (strMap, processValue) => {
	const res = {};
	for (const [key, value] of strMap) {
		res[key] = processValue ? processValue(value) : value;
	}
	return res;
};

const getDateForItem = (item, fromEndOfMerge = false) => {
	if (Array.isArray(item)) {
		return (fromEndOfMerge ? item[item.length - 1] : item[0]).timestamp;
	}
	return item.timestamp;
};

class Branch {
	constructor(name, id) {
		this.startIndex = 0;
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
		return this.startIndex + this.changes.size + this.merges.size;
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

	getItemAt(index) {
		const changeAtIndex = this.changes.get(index);
		const mergeAtIndex = this.merges.get(index);
		if (changeAtIndex && mergeAtIndex) {
			throw new Error(`Branch has a merge and a change with the same index ${index}`);
		}
		if (!(changeAtIndex || mergeAtIndex) && index > 0) {
			throw new Error(`Branch is missing an item at index ${index}`);
		}
		return changeAtIndex || mergeAtIndex;
	}

	serialize() {
		const firstItem = this.getItemAt(0);
		const latestItem = this.getItemAt(this.getNextKey() - 1);
		const lastMergeKey = this.getHighestMergeIndex();
		return {
			id: this.id,
			changes: stringMapToObj(this.changes, compressChange),
			merges: stringMapToObj(this.merges, (changes) => changes.map(compressChange)),
			discussions: stringMapToObj(this.discussions),
			lastMergeKey: lastMergeKey,
			firstKeyAt: firstItem && getDateForItem(firstItem),
			latestKeyAt: latestItem && getDateForItem(latestItem, true),
		};
	}

	*getIntermediateDocStates(optionalHighestIndex, withIndex) {
		const highestIndex =
			typeof optionalHighestIndex === 'number'
				? optionalHighestIndex
				: this.getHighestIndex();
		let intermediateDocument = null;
		for (let index = this.startIndex; index <= highestIndex; index += 1) {
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
