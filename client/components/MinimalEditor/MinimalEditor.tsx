import React, { useState, useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';
import { NodeSpec } from 'prosemirror-model';

import { DocJson } from 'types';
import Editor, { getTextFromDoc, EditorChangeObject, OnEditFn } from 'components/Editor';
import { FormattingBarButtonData } from '../FormattingBar/types';

require('./minimalEditor.scss');

type Props = {
	constrainHeight?: boolean;
	customNodes?: Record<string, NodeSpec>;
	debounceEditsMs?: number;
	focusOnLoad?: boolean;
	noMinHeight?: boolean;
	initialContent?: any;
	isReadOnly?: boolean;
	isTranslucent?: boolean;
	onEdit?: OnEditFn;
	onContent?: ({ text: string, content: any }) => unknown;
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
	} = props;
	const [changeObject, setChangeObject] = useState<EditorChangeObject | null>(null);
	const [FormattingBar, setFormattingBar] = useState<any>(null as any);
	const controlsContainerRef = useRef<HTMLDivElement>(null as any);

	useEffect(() => {
		if (focusOnLoad && changeObject?.view) {
			changeObject.view.focus();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		import('../FormattingBar').then(({ buttons, FormattingBar: FormattingBarComponent }) => {
			setFormattingBar(() => (innerProps) => (
				<FormattingBarComponent {...innerProps} buttons={getButtons(buttons as any)} />
			));
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
			{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
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
