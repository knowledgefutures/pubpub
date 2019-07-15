import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Editor, { getText, getJSON } from '@pubpub/editor';
import { FormattingBar } from 'components';

require('./minimalEditor.scss');

const propTypes = {
	initialContent: PropTypes.object,
	onChange: PropTypes.func,
	useFormattingBar: PropTypes.bool,
	focusOnLoad: PropTypes.bool,
	placeholder: PropTypes.string,
};

const defaultProps = {
	initialContent: undefined,
	onChange: () => {},
	useFormattingBar: false,
	focusOnLoad: false,
	placeholder: undefined,
};

const MinimalEditor = (props) => {
	const { initialContent, onChange, useFormattingBar, focusOnLoad, placeholder } = props;
	const [changeObject, setChangeObject] = useState({});
	useEffect(() => {
		if (focusOnLoad && changeObject.view) {
			changeObject.view.focus();
		}
	}, [focusOnLoad, changeObject.view]);
	return (
		<div className="minimal-editor-component">
			{useFormattingBar && (
				<FormattingBar
					editorChangeObject={changeObject}
					threads={[]}
					hideBlocktypes={true}
					hideExtraFormatting={true}
					hideMedia={true}
					isSmall={true}
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
