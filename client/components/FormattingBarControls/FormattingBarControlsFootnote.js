/* eslint-disable react/no-danger */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SimpleEditor from 'components/SimpleEditor/SimpleEditor';
import { formatCitationString } from 'utilities';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

class FormattingBarControlsFootnote extends Component {
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
			<div className={`formatting-bar-controls-component ${this.props.isSmall ? 'small' : ''}`}>
				{/*  Content Adjustment */}
				<div className="block">
					<div className="label">Text</div>
					<div className="input wide">
						<div className="simple-editor-wrapper">
							<SimpleEditor
								initialHtmlString={this.props.attrs.value}
								onChange={(htmlString)=> {
									this.props.updateAttrs({ value: htmlString });
								}}
							/>
						</div>
					</div>
				</div>

				{/*  Content Adjustment */}
				<div className="block">
					<div className="label">Structured Data</div>
					<div className="input wide">
						<textarea
							placeholder="Enter bibtex, DOI, wikidata url, or bibjson..."
							className="bp3-input bp3-fill"
							value={this.state.structuredValue}
							onChange={this.handleValueChange}
						/>
					</div>
				</div>

				{/*  Output */}
				<div className="block">
					<div className="label">Structured Data Output</div>
					<div className="input wide">
						<div
							className="rendered-citation"
							dangerouslySetInnerHTML={{ __html: this.state.structuredHtml }}
						/>
					</div>
				</div>
			</div>
		);
	}
}


FormattingBarControlsFootnote.propTypes = propTypes;
export default FormattingBarControlsFootnote;
