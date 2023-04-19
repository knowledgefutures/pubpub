import { Step } from 'prosemirror-transform';
import { Selection, TextSelection, Transaction } from 'prosemirror-state';

export const getNewSelectionForTransaction = (
	newTransaction: Transaction,
	startingSelection: Selection,
	mapForward: boolean = false,
) => {
	if (startingSelection instanceof TextSelection) {
		const assoc = mapForward ? 1 : -1;
		return newTransaction.steps.reduce(
			(selection: TextSelection, step: Step, index: number) => {
				const map = step.getMap();
				const nextAnchor = map.map(selection.anchor, assoc);
				const nextHead = map.map(selection.head, assoc);
				const currentDoc =
					index === newTransaction.docs.length
						? newTransaction.docs[index + 1]
						: newTransaction.doc;
				return TextSelection.create(currentDoc, nextAnchor, nextHead);
			},
			startingSelection,
		);
	}
	return startingSelection.map(newTransaction.doc, newTransaction.mapping);
};

export const mapSelectionThroughTransaction = (
	newTransaction: Transaction,
	startingSelection: Selection,
) => {
	const newSelection = getNewSelectionForTransaction(newTransaction, startingSelection);
	newTransaction.setSelection(newSelection);
};
