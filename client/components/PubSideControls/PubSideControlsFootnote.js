/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SimpleEditor from 'components/SimpleEditor/SimpleEditor';
import { formatCitationString } from 'utilities';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
};

class PubSideControlsFootnote extends Component {
	constructor(props) {
		super(props);
		this.state = {
			structuredValue: props.attrs.structuredValue,
			structuredHtml: props.attrs.structuredHtml,
		};

		this.handleValueChange = this.handleValueChange.bind(this);
		this.handleHTMLChange = this.handleHTMLChange.bind(this);
	}

	handleValueChange(evt) {
		this.setState({ structuredValue: evt.target.value });
		formatCitationString(evt.target.value, this.handleHTMLChange);
	}

	handleHTMLChange(html) {
		const newAttrs = { structuredValue: this.state.structuredValue, structuredHtml: html };
		this.props.updateAttrs(newAttrs);
		this.setState(newAttrs);
	}

	render() {
		return (
			<div className="pub-side-controls-footnote-component">
				<div className="options-title">Footnote Details</div>

				{/*  Content Adjustment */}
				<div className="form-label first">
					Text
				</div>
				<div className="simple-editor-wrapper">
					<SimpleEditor
						initialHtmlString={this.props.attrs.value}
						onChange={(htmlString)=> {
							this.props.updateAttrs({ value: htmlString });
						}}
					/>
				</div>

				{/*  Content Adjustment */}
				<div className="form-label">
					Structured Data
				</div>
				<textarea
					placeholder="Enter bibtex, DOI, wikidata url, or bibjson..."
					className="bp3-input bp3-fill"
					value={this.state.structuredValue}
					onChange={this.handleValueChange}
				/>

				{/*  Output */}
				<div className="form-label">
					Structured Data Output
				</div>
				<div
					className="rendered-citation"
					dangerouslySetInnerHTML={{ __html: this.state.structuredHtml }}
				/>

			</div>
		);
	}
}


PubSideControlsFootnote.propTypes = propTypes;
export default PubSideControlsFootnote;
