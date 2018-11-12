import React, { Component } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	onChange: PropTypes.func.isRequired,
	// onRemove: PropTypes.func.isRequired,
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* deprecated: title, html */
	/* html */
};

class LayoutEditorHtml extends Component {
	constructor(props) {
		super(props);
		// this.handleRemove = this.handleRemove.bind(this);
		this.setText = this.setText.bind(this);
		// this.changeTitle = this.changeTitle.bind(this);
	}

	setText(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			html: evt.target.value,
		});
	}

	// handleRemove() {
	// 	this.props.onRemove(this.props.layoutIndex);
	// }

	// changeTitle(evt) {
	// 	this.props.onChange(this.props.layoutIndex, {
	// 		...this.props.content,
	// 		title: evt.target.value,
	// 	});
	// }

	render() {
		return (
			<div className="layout-editor-html-component">
				<div className="block-header">
					{/* <div className="pt-form-group">
						<label htmlFor={`section-title-${this.props.layoutIndex}`}>HTML Section Title</label>
						<input id={`section-title-${this.props.layoutIndex}`} type="text" className="pt-input" value={this.props.content.title} onChange={this.changeTitle} />
					</div>
					<div className="spacer" />
					<div className="pt-form-group">
						<div className="pt-button-group">
							<button className="pt-button pt-icon-trash" onClick={this.handleRemove} />
						</div>
					</div> */}
				</div>

				<div className="block-content">
					<div className="container">
						{/*this.props.content.title &&
							<div className="row">
								<div className="col-12">
									<h2 className="block-title">{this.props.content.title}</h2>
								</div>
							</div>
						*/}
						<div className="row">
							<div className="col-12">
								<textarea
									value={this.props.content.html}
									onChange={this.setText}
									placeholder="Type HTML here..."
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

LayoutEditorHtml.propTypes = propTypes;
export default LayoutEditorHtml;
