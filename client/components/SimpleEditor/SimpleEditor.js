import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Editor, { importHtml, getText } from '@pubpub/editor';
// import FormattingBar from 'components/FormattingBar/FormattingBar';

const propTypes = {
	initialHtmlString: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired, /* Return HTML string of content */
	placeholder: PropTypes.string,
};

const defaultProps = {
	placeholder: undefined,
};

class SimpleEditor extends Component {
	constructor(props) {
		super(props);
		this.state = {
			// editorChangeObject: {},
		};
		this.handleChange = this.handleChange.bind(this);
		this.intializedWithHtmlInput = false;
	}

	handleChange(changeObject) {
		if (!this.intializedWithHtmlInput) {
			this.intializedWithHtmlInput = true;
			importHtml(changeObject.view, this.props.initialHtmlString);
		}
		const innerHtml = getText(changeObject.view)
			? changeObject.view.dom.innerHTML
			: '';
		this.props.onChange(innerHtml);
		// this.setState({
		// 	editorChangeObject: changeObject,
		// });
	}

	render() {
		return (
			<div className="simple-editor-component">
				{/* <FormattingBar
					editorChangeObject={this.state.editorChangeObject}
					hideBlocktypes={true}
					hideExtraFormatting={true}
					hideMedia={true}
					isSmall={true}
				/> */}
				<Editor
					onChange={this.handleChange}
					customNodes={{
						blockquote: undefined,
						horizontal_rule: undefined,
						heading: undefined,
						ordered_list: undefined,
						bullet_list: undefined,
						list_item: undefined,
						code_block: undefined,
						citation: undefined,
						equation: undefined,
						block_equation: undefined,
						file: undefined,
						footnote: undefined,
						iframe: undefined,
						image: undefined,
						table: undefined,
						table_cell: undefined,
						table_row: undefined,
						table_header: undefined,
						video: undefined,
						highlightQuote: undefined,
					}}
					customPlugins={{
						headerIds: undefined,
						highlights: undefined,
					}}
					placeholder={this.props.placeholder}
				/>
			</div>
		);
	}
}


SimpleEditor.propTypes = propTypes;
SimpleEditor.defaultProps = defaultProps;
export default SimpleEditor;
