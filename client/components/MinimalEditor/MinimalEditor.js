import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Editor, { getText, getJSON } from '@pubpub/editor';
import FormattingBar from 'components/FormattingBarNew/FormattingBar';

require('./minimalEditor.scss');

const propTypes = {
	initialContent: PropTypes.object,
	onChange: PropTypes.func,
	useFormattingBar: PropTypes.bool,
	focusOnLoad: PropTypes.bool,
	placeholder: PropTypes.string,
	isTranslucent: PropTypes.bool,
};

const defaultProps = {
	initialContent: undefined,
	onChange: () => {},
	useFormattingBar: false,
	focusOnLoad: false,
	placeholder: undefined,
	isTranslucent: false,
};

const MinimalEditor = (props) => {
	const {
		initialContent,
		onChange,
		useFormattingBar,
		focusOnLoad,
		placeholder,
		isTranslucent,
		formattingBarButtons,
	} = props;
	const [changeObject, setChangeObject] = useState({});
	useEffect(() => {
		if (focusOnLoad && changeObject.view) {
			changeObject.view.focus();
		}
	}, [focusOnLoad, changeObject.view]);
	return (
		<div
			className={classNames(
				'minimal-editor-component',
				isTranslucent && 'translucent',
				useFormattingBar && 'has-formatting-bar',
			)}
		>
			{useFormattingBar && (
				<FormattingBar
					editorChangeObject={changeObject}
					showBlockTypes={false}
					showMedia={false}
					isSmall={true}
					isTranslucent={isTranslucent}
					buttons={formattingBarButtons}
				/>
			)}
			<div className="editor-wrapper">
				<Editor
					initialContent={initialContent}
					placeholder={placeholder}
					onChange={(editorChangeObject) => {
						setChangeObject(editorChangeObject);
						onChange({
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
