const SUPPORTED_DECORATIONS = new Set(['i', 'em', 'b', 'strong']);

function trimNodeContentsInner(element: Node, totalCharsToTrim: number) {
	if (totalCharsToTrim === 0) return 0;
	for (let i = element.childNodes.length - 1; i >= 0; i--) {
		const child = element.childNodes[i];
		totalCharsToTrim = trimNodeContentsInner(child as Element, totalCharsToTrim);
	}
	if (element.nodeType === Node.TEXT_NODE) {
		const elementTextContent = element.textContent!;
		const elementCharsToTrim = Math.min(totalCharsToTrim, elementTextContent.length);
		totalCharsToTrim -= elementCharsToTrim;
		element.textContent = elementTextContent.slice(0, -elementCharsToTrim);
	} else if (element.nodeType === Node.ELEMENT_NODE && element.textContent!.length === 0) {
		element.parentElement!.removeChild(element);
	}
	return totalCharsToTrim;
}

export function trimDocumentFragment(doc: DocumentFragment, maxLength: number) {
	const charactersToTrim = doc.textContent!.length - maxLength;
	if (charactersToTrim <= 0) {
		return;
	}
	trimNodeContentsInner(doc, charactersToTrim);
}

export function isChildOf(descendant: Node, ancestor: Node) {
	let node: Node | null = descendant;
	while (node !== null) {
		if (node === ancestor) return true;
		node = node.parentNode;
	}
	return false;
}

function stripAttrs(element: Element) {
	while (element.attributes.length > 0) {
		element.removeAttribute(element.attributes[0].name);
	}
}

function sanitizeElement(element: Element) {
	if (!SUPPORTED_DECORATIONS.has(element.tagName.toLowerCase())) {
		const parent = element.parentNode!;
		if (element.textContent !== null && element.textContent.length > 0) {
			const textNode = document.createTextNode(element.textContent ?? '');
			parent.replaceChild(textNode, element);
		} else {
			parent.removeChild(element);
		}
		return;
	}
	stripAttrs(element);
	if (element.nodeType === Node.ELEMENT_NODE) {
		for (let i = element.children.length - 1; i >= 0; i--) {
			sanitizeElement(element.children[i]);
		}
	} else if (element.nodeType === Node.TEXT_NODE) {
		element.textContent = element.textContent?.replace(/[\r\n]+/gm, '') ?? null;
	}
}

export function sanitizeDocumentFragment(doc: DocumentFragment) {
	for (let i = doc.children.length - 1; i >= 0; i--) {
		sanitizeElement(doc.children[i]);
	}
}

export function parseDom(html: string) {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template;
}
