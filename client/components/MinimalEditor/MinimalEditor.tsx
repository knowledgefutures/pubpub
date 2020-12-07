import React, { useState, useEffect, useRef } from 'react';
import classNames from 'classnames';
import Editor, { getText, getJSON } from 'components/Editor';

require('./minimalEditor.scss');

type OwnProps = {
	constrainHeight?: boolean;
	focusOnLoad?: boolean;
	initialContent?: any;
	isTranslucent?: boolean;
	onChange?: (...args: any[]) => any;
	placeholder?: string;
	useFormattingBar?: boolean;
};

const defaultProps = {
	constrainHeight: false,
	focusOnLoad: false,
	initialContent: undefined,
	isTranslucent: false,
	onChange: () => {},
	placeholder: undefined,
	useFormattingBar: false,
};

type Props = OwnProps & typeof defaultProps;

const MinimalEditor = (props: Props) => {
	const {
		initialContent,
		constrainHeight,
		onChange,
		useFormattingBar,
		focusOnLoad,
		placeholder,
		isTranslucent,
	} = props;
	const [changeObject, setChangeObject] = useState({});
	const [FormattingBar, setFormattingBar] = useState(null);
	const editorWrapperRef = useRef(null);

	useEffect(() => {
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
		if (focusOnLoad && changeObject.view) {
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
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
			// @ts-expect-error ts-migrate(2339) FIXME: Property 'view' does not exist on type '{}'.
			const { view } = changeObject;
			if (!view.hasFocus()) {
				view.focus();
			}
		}
	};

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
					// @ts-expect-error ts-migrate(2322) FIXME: Type '() => boolean' is not assignable to type 'un... Remove this comment to see the full error message
					onScrollToSelection={() => true}
					// @ts-expect-error ts-migrate(2322) FIXME: Type '(editorChangeObject: any) => void' is not as... Remove this comment to see the full error message
					onChange={(editorChangeObject) => {
						setChangeObject(editorChangeObject);
						onChange({
							view: editorChangeObject.view,
							content: getJSON(editorChangeObject.view),
							text: getText(editorChangeObject.view) || '',
						});
					}}
					customPlugins={{
						headerIds: undefined,
						highlights: undefined,
					}}
				/>
			</div>
		</div>
	);
};
MinimalEditor.defaultProps = defaultProps;
export default MinimalEditor;
