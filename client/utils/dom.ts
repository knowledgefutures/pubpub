export const getHighestAncestorWithId = (node: Element, root: Element = document.body) => {
	let element: Element | null = node;
	let highestAncestorWithId: Element | null = null;

	while (element && element !== root) {
		if (element.hasAttribute('id')) {
			highestAncestorWithId = element;
		}
		element = element.parentElement;
	}

	if (element !== root) {
		return null;
	}

	return highestAncestorWithId;
};

export const getLowestAncestorWithId = (node: HTMLElement) => {
	let ancestor: HTMLElement | null = node;

	while (ancestor && !ancestor.hasAttribute('id')) {
		ancestor = ancestor.parentElement;
	}

	return ancestor;
};
