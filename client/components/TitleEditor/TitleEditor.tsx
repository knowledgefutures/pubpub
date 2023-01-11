import React, { ClipboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { useBeforeUnload } from 'react-use';

import { ClientOnly } from 'components';
import {
	trimDocumentFragment,
	parseDom,
	sanitizeDocumentFragment,
	isChildOf,
} from './titleEditorFunctions';

require('./titleEditor.scss');

type Props = {
	isReadOnly?: boolean;
	initialValue?: string;
	onChange?: (html: string, text: string) => void;
	onInput?: (html: string, text: string) => void;
	className?: string;
	placeholder?: string;
	maxLength?: number;
};

const SUPPORTED_KEYS = new Set(['Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

const commonProps = {
	role: 'textbox',
	'aria-label': 'Edit Pub title',
	tabIndex: 0,
};

export default function TitleEditor(props: Props) {
	const {
		initialValue = '',
		onChange,
		onInput,
		isReadOnly = false,
		maxLength = Infinity,
		...restProps
	} = props;
	const node = useRef<HTMLDivElement>(null);
	const init = useRef(false);
	const [focused, setFocused] = useState(false);
	const sharedProps = {
		...commonProps,
		...restProps,
		className: classNames('title-editor-component', restProps.className),
		'data-placeholder': restProps.placeholder,
	};

	const handlePaste = useCallback(
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
			if (maxLength !== null)
				trimDocumentFragment(dom.content, maxLength - editor.textContent!.length);

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
		[node, maxLength],
	);

	const handleKeyDown = useCallback(
		(event) => {
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
			} else if (
				!SUPPORTED_KEYS.has(event.key) &&
				event.metaKey === false &&
				(getSelection() === null || getSelection()?.toString() === '') &&
				node.current &&
				node.current.innerText.length >= maxLength
			) {
				event.preventDefault();
			}
		},
		[node, maxLength],
	);

	// contenteditable inserts a <br> when it contains an element (e.g. <b>,
	// <em>, etc.) and its contents are cleared.
	const handleInput = useCallback(() => {
		if (node.current?.textContent === '') {
			node.current.innerHTML = '';
		}
		if (onInput) {
			const html = node.current?.innerHTML ?? '';
			const text = node.current?.innerText ?? '';
			onInput(html, text);
		}
	}, [node, onInput]);

	const handleFocus = useCallback(() => {
		setFocused(true);
	}, []);

	const handleBlur = useCallback(() => {
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
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				onInput={handleInput}
				onFocus={handleFocus}
				onBlur={handleBlur}
			/>
		</ClientOnly>
	);
}
