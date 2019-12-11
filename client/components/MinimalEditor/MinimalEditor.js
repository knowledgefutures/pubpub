import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Editor, { getText, getJSON } from '@pubpub/editor';

require('./minimalEditor.scss');

const propTypes = {
	initialContent: PropTypes.object,
	onChange: PropTypes.func,
	onBlur: PropTypes.func,
	useFormattingBar: PropTypes.bool,
	focusOnLoad: PropTypes.bool,
	placeholder: PropTypes.string,
	isTranslucent: PropTypes.bool,
};

const defaultProps = {
	initialContent: undefined,
	onChange: () => {},
	onBlur: () => {},
	useFormattingBar: false,
	focusOnLoad: false,
	placeholder: undefined,
	isTranslucent: false,
};

const MinimalEditor = (props) => {
	const {
		initialContent,
		constrainHeight,
		onChange,
		onBlur,
		useFormattingBar,
		focusOnLoad,
		placeholder,
		isTranslucent,
	} = props;
	const [changeObject, setChangeObject] = useState({});
	const [FormattingBar, setFormattingBar] = useState(null);

	useEffect(() => {
		if (focusOnLoad && changeObject.view) {
			changeObject.view.focus();
		}
	}, [focusOnLoad, changeObject.view]);

	useEffect(() => {
		import('../FormattingBarNew').then((module) => {
			setFormattingBar(() => (innerProps) => (
				<module.FormattingBar {...innerProps} buttons={module.buttons.minimalButtonSet} />
			));
		});
	}, []);

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
					editorChangeObject={changeObject}
					showBlockTypes={false}
					showMedia={false}
					isSmall={true}
					isTranslucent={isTranslucent}
				/>
			)}
			<div className="editor-wrapper">
				<Editor
					onBlur={onBlur}
					initialContent={initialContent}
					placeholder={placeholder}
					handleScrollToSelection={() => true}
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
