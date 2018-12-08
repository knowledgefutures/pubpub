/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SimpleEditor from 'components/SimpleEditor/SimpleEditor';
import { formatCitationString } from 'utilities';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
};

class PubSideControlsCitation extends Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.attrs.value,
			html: props.attrs.html,
		};

		this.handleValueChange = this.handleValueChange.bind(this);
		this.handleHTMLChange = this.handleHTMLChange.bind(this);
	}

	handleValueChange(evt) {
		this.setState({ value: evt.target.value });
		formatCitationString(evt.target.value, this.handleHTMLChange);
	}

	handleHTMLChange(html) {
		const newAttrs = { value: this.state.value, html: html };
		this.props.updateAttrs(newAttrs);
		this.setState(newAttrs);
	}

	render() {
		return (
			<div className="pub-side-controls-citation-component">
				<div className="options-title">Citation Details</div>

				{/*  Content Adjustment */}
				<div className="form-label first">
					Structured Data
				</div>
				<textarea
					placeholder="Enter bibtex, DOI, wikidata url, or bibjson..."
					className="bp3-input bp3-fill"
					value={this.state.value}
					onChange={this.handleValueChange}
				/>

				{/*  Output */}
				<div className="form-label">
					Structured Data Output
				</div>
				<div
					className="rendered-citation"
					dangerouslySetInnerHTML={{ __html: this.state.html }}
				/>

				{/*  Content Adjustment */}
				<div className="form-label">
					Text
				</div>
				<div className="simple-editor-wrapper">
					<SimpleEditor
						initialHtmlString={this.props.attrs.unstructuredValue}
						onChange={(htmlString)=> {
							this.props.updateAttrs({ unstructuredValue: htmlString });
						}}
					/>
				</div>
			</div>
		);
	}
}


PubSideControlsCitation.propTypes = propTypes;
export default PubSideControlsCitation;
