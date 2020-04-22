import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Editor, { getText, getJSON } from 'components/Editor';

require('./minimalEditor.scss');

const propTypes = {
	constrainHeight: PropTypes.bool,
	focusOnLoad: PropTypes.bool,
	initialContent: PropTypes.object,
	isTranslucent: PropTypes.bool,
	onChange: PropTypes.func,
	placeholder: PropTypes.string,
	useFormattingBar: PropTypes.bool,
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

const MinimalEditor = (props) => {
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
		if (focusOnLoad && changeObject.view) {
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
					onScrollToSelection={() => true}
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

MinimalEditor.propTypes = propTypes;
MinimalEditor.defaultProps = defaultProps;
export default MinimalEditor;
