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

class FormattingBarControlsCitation extends Component {
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
			<div className={`formatting-bar-controls-component ${this.props.isSmall ? 'small' : ''}`}>
				{/*  Content Adjustment */}
				<div className="block">
					<div className="label">Structured Data</div>
					<div className="input wide">
						<textarea
							placeholder="Enter bibtex, DOI, wikidata url, or bibjson..."
							className="bp3-input bp3-fill"
							value={this.state.value}
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
							dangerouslySetInnerHTML={{ __html: this.state.html }}
						/>
					</div>
				</div>

				{/*  Content Adjustment */}
				<div className="block">
					<div className="label">Text</div>
					<div className="input wide">
						<div className="simple-editor-wrapper">
							<SimpleEditor
								initialHtmlString={this.props.attrs.unstructuredValue}
								onChange={(htmlString)=> {
									this.props.updateAttrs({ unstructuredValue: htmlString });
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}


FormattingBarControlsCitation.propTypes = propTypes;
export default FormattingBarControlsCitation;
