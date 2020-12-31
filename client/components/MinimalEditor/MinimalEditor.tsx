import React, { useState, useEffect, useRef, useCallback } from 'react';
import classNames from 'classnames';

import Editor, { getTextFromDoc, EditorChangeObject, OnEditFn } from 'components/Editor';

require('./minimalEditor.scss');

type Props = {
	constrainHeight?: boolean;
	focusOnLoad?: boolean;
	initialContent?: any;
	isTranslucent?: boolean;
	onEdit?: OnEditFn;
	onContent?: ({ text: string, content: any }) => unknown;
	placeholder?: string;
	useFormattingBar?: boolean;
};

const handleScrollToSelection = () => true;

const MinimalEditor = (props: Props) => {
	const {
		initialContent,
		constrainHeight = false,
		onEdit,
		onContent,
		useFormattingBar = false,
		focusOnLoad = false,
		placeholder,
		isTranslucent = false,
	} = props;
	const [changeObject, setChangeObject] = useState<EditorChangeObject | null>(null);
	const [FormattingBar, setFormattingBar] = useState(null);
	const editorWrapperRef = useRef(null);

	useEffect(() => {
		if (focusOnLoad && changeObject?.view) {
			changeObject.view.focus();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		// TODO(ian):
		// We need to do a dynamic import here to get around the FormattingBar <-> MinimalEditor
		// circular dependency. The use of require() is a hack to get around a bug that I suspect
		// will be fixed in an upcoming version of Webpack:
		// https://github.com/webpack/webpack/issues/10104
		// eslint-disable-next-line global-require
		Promise.resolve(require('../FormattingBar')).then(
			({ buttons, FormattingBar: FormattingBarComponent }) => {
				// @ts-expect-error ts-migrate(2345) FIXME: Argument of type '() => (innerProps: any) => Eleme... Remove this comment to see the full error message
				setFormattingBar(() => (innerProps) => (
					<FormattingBarComponent {...innerProps} buttons={buttons.minimalButtonSet} />
				));
			},
		);
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
					content: doc.toJSON(),
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
			)}
		>
			{useFormattingBar && FormattingBar && (
				// @ts-expect-error ts-migrate(2604) FIXME: JSX element type 'FormattingBar' does not have any... Remove this comment to see the full error message
				<FormattingBar
					popoverContainerRef={editorWrapperRef}
					editorChangeObject={changeObject}
					showBlockTypes={false}
					isSmall={true}
					isTranslucent={isTranslucent}
				/>
			)}
			{/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
			<div className="editor-wrapper" onClick={handleWrapperClick}>
				<div className="editor-wrapper-inner" ref={editorWrapperRef} />
				<Editor
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
