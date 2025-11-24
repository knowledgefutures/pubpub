import type { NodeSpec } from 'prosemirror-model';

import type { DocJson } from 'types';

import type { FormattingBarButtonData } from '../FormattingBar/types';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import Editor, { type EditorChangeObject, getTextFromDoc, type OnEditFn } from 'components/Editor';

import './minimalEditor.scss';

type Props = {
	constrainHeight?: boolean;
	customNodes?: Record<string, NodeSpec>;
	debounceEditsMs?: number;
	focusOnLoad?: boolean;
	noMinHeight?: boolean;
	initialContent?: any;
	isReadOnly?: boolean;
	isTranslucent?: boolean;
	resizable?: boolean;
	onEdit?: OnEditFn;
	onContent?: ({ text, content }: { text: string; content?: DocJson | null }) => unknown;
	placeholder?: string;
	useFormattingBar?: boolean;
	getButtons?: (
		buttons: Record<string, FormattingBarButtonData[][]>,
	) => FormattingBarButtonData[][];
};

const handleScrollToSelection = () => true;
const defaultGetButtons = (buttons) => buttons.minimalButtonSet;

const MinimalEditor = (props: Props) => {
	const {
		customNodes,
		debounceEditsMs = 0,
		initialContent,
		constrainHeight = false,
		noMinHeight = false,
		onEdit,
		onContent,
		useFormattingBar = false,
		focusOnLoad = false,
		placeholder,
		isReadOnly = false,
		isTranslucent = false,
		getButtons = defaultGetButtons,
		resizable = false,
	} = props;
	const [changeObject, setChangeObject] = useState<EditorChangeObject | null>(null);
	const [FormattingBar, setFormattingBar] = useState<any>(null as any);
	const controlsContainerRef = useRef<HTMLDivElement>(null as any);

	useEffect(() => {
		if (focusOnLoad && changeObject?.view) {
			changeObject.view.focus();
		}
	}, []);

	useEffect(() => {
		import('../FormattingBar').then(({ buttons, FormattingBar: FormattingBarComponent }) => {
			setFormattingBar(() => (innerProps) => (
				<FormattingBarComponent {...innerProps} buttons={getButtons(buttons as any)} />
			));
		});
	}, []);

	const handleWrapperClick = () => {
		if (changeObject) {
			const { view } = changeObject;
			if (!view.hasFocus()) {
				view.focus();
			}
		}
	};

	const handleEdit = useCallback(
		(...args: Parameters<OnEditFn>) => {
			if (onEdit) {
				onEdit(...args);
			}
			if (onContent) {
				const [doc] = args;
				onContent({
					content: doc.toJSON() as DocJson,
					text: getTextFromDoc(doc),
				});
			}
		},
		[onEdit, onContent],
	);

	return (
		<div
			className={classNames(
				'minimal-editor-component',
				constrainHeight && 'constrain-height',
				isTranslucent && 'translucent',
				useFormattingBar && 'has-formatting-bar',
				noMinHeight && 'no-min-height',
				resizable && 'resizable',
			)}
		>
			{useFormattingBar && FormattingBar && (
				<FormattingBar
					editorChangeObject={changeObject}
					isTranslucent={isTranslucent}
					showBlockTypes={false}
					isSmall
					controlsConfiguration={{
						container: controlsContainerRef.current!,
					}}
				/>
			)}
			{/* biome-ignore lint/a11y: shhhhhh */}
			<div className="editor-wrapper" onClick={handleWrapperClick}>
				<div ref={controlsContainerRef} />
				<Editor
					isReadOnly={isReadOnly}
					customNodes={customNodes}
					debounceEditsMs={debounceEditsMs}
					initialContent={initialContent}
					placeholder={placeholder}
					onScrollToSelection={handleScrollToSelection}
					onEdit={handleEdit}
					onChange={setChangeObject}
					customPlugins={{
						headerIds: null,
						highlights: null,
					}}
				/>
			</div>
		</div>
	);
};

export default MinimalEditor;
