import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { importHtml, getText } from '@pubpub/editor';
import MinimalEditor from '../MinimalEditor/MinimalEditor';
// import FormattingBar from 'components/FormattingBar/FormattingBar';

const propTypes = {
	initialHtmlString: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired /* Return HTML string of content */,
	onBlur: PropTypes.func,
	placeholder: PropTypes.string,
};

const defaultProps = {
	placeholder: undefined,
	onBlur: () => {},
};

class SimpleEditor extends Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.handleChange = this.handleChange.bind(this);
		this.intializedWithHtmlInput = false;
	}

	handleChange({ text, view }) {
		if (!this.intializedWithHtmlInput) {
			this.intializedWithHtmlInput = true;
			importHtml(view, this.props.initialHtmlString);
		}
		const innerHtml = text ? view.dom.innerHTML : '';
		this.props.onChange(innerHtml);
	}

	render() {
		return (
			<MinimalEditor
				onChange={this.handleChange}
				onBlur={this.props.onBlur}
				placeholder={this.props.placeholder}
				useFormattingBar={true}
				isTranslucent={true}
				constrainHeight={true}
			/>
		);
	}
}

SimpleEditor.propTypes = propTypes;
SimpleEditor.defaultProps = defaultProps;
export default SimpleEditor;
