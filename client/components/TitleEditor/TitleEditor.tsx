import classNames from 'classnames';
import { useBeforeUnload } from 'react-use';
import React, { ClipboardEvent, useCallback, useEffect, useRef, useState } from 'react';

import { ClientOnly } from 'components';

require('./titleEditor.scss');

type Props = {
	isReadOnly?: boolean;
	initialValue?: string;
	onChange?: (html: string, text: string) => void;
	className?: string;
	placeholder?: string;
};

const SUPPORTED_DECORATIONS = new Set(['i', 'em', 'b', 'strong']);

function isChildOf(descendant: Node, ancestor: Node) {
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

function sanitizeDocumentFragment(doc: DocumentFragment) {
	for (let i = doc.children.length - 1; i >= 0; i--) {
		sanitizeElement(doc.children[i]);
	}
}

function parseDom(html: string) {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template;
}

const commonProps = {
	role: 'textbox',
	'aria-label': 'Edit Pub title',
	tabIndex: 0,
};

export default function TitleEditor(props: Props) {
	const { initialValue = '', onChange, isReadOnly = false, ...restProps } = props;
	const node = useRef<HTMLDivElement>(null);
	const init = useRef(false);
	const [focused, setFocused] = useState(false);
	const sharedProps = {
		...commonProps,
		...restProps,
		className: classNames('title-editor-component', restProps.className),
		'data-placeholder': restProps.placeholder,
	};

	const onPaste = useCallback(
		(event: ClipboardEvent) => {
			event.preventDefault();
			const editor = node.current;
			if (editor === null) return;
			const selection = getSelection();
			if (selection === null) return;
			const range = selection.getRangeAt(0);
			const html = event.clipboardData.getData('text/html');
			const dom = parseDom(html);
			sanitizeDocumentFragment(dom.content);
			let pasted = false;
			// execCommand is a deprecated API, but it's still found in most
			// browsers and is the easist way to support undo/redo without
			// implementing a fully-controlled editor
			if ('execCommand' in document) {
				pasted = document.execCommand('insertHTML', false, dom.innerHTML);
			}
			// execCommand is either unsupported or the 'insertHTML' command
			// failed, so we'll need to insert the sanitized content manually.
			// Undo won't work here, unfortunately.
			if (pasted === false) {
				const target = selection.focusNode;
				if (!target) return;
				if (!isChildOf(target, editor)) return;
				range.deleteContents();
				range.insertNode(dom.content);
				range.collapse(false);
			}
		},
		[node],
	);

	const onKeyDown = useCallback((event) => {
		if (event.key === 'Enter') {
			event.preventDefault();
		} else if (event.key.toLowerCase() === 'u' && event.metaKey) {
			event.preventDefault();
		} else if (event.key.toLowerCase() === 'b' && event.metaKey) {
			event.preventDefault();
			document.execCommand('Bold', false);
		} else if (event.key.toLowerCase() === 'i' && event.metaKey) {
			event.preventDefault();
			document.execCommand('Italic', false);
		}
	}, []);

	// contenteditable inserts a <br> when it contains an element (e.g. <b>,
	// <em>, etc.) and its contents are cleared.
	const onInput = useCallback(() => {
		if (node.current?.textContent === '') {
			node.current.innerHTML = '';
		}
	}, [node]);

	const onFocus = useCallback(() => {
		setFocused(true);
	}, []);

	const onBlur = useCallback(() => {
		const html = node.current?.innerHTML ?? '';
		const text = node.current?.innerText ?? '';
		onChange?.(html, text);
		setFocused(false);
	}, [onChange]);

	useEffect(() => {
		if (init.current) return;
		if (node.current) {
			node.current.innerHTML = initialValue;
			init.current = true;
			onChange?.(initialValue, node.current?.innerText ?? '');
		}
	}, [initialValue, onChange]);

	useBeforeUnload(
		() => !isReadOnly && focused && node.current?.innerHTML !== initialValue,
		'You have unsaved changes to this Pub. Are you sure you want to navigate away?',
	);

	const serverOrReadonlyView = (
		<div
			{...sharedProps}
			// We need to set contentEditable={true} during SSR, otherwise
			// the hydrated editor will be unedtiable.
			contentEditable={!isReadOnly}
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{ __html: initialValue }}
		/>
	);

	return isReadOnly ? (
		serverOrReadonlyView
	) : (
		<ClientOnly fallback={serverOrReadonlyView}>
			{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
			<div
				{...sharedProps}
				contentEditable={true}
				ref={node}
				onKeyDown={onKeyDown}
				onPaste={onPaste}
				onInput={onInput}
				onFocus={onFocus}
				onBlur={onBlur}
			/>
		</ClientOnly>
	);
}
