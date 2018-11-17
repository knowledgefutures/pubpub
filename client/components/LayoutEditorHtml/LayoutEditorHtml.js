import React, { Component } from 'react';
import PropTypes from 'prop-types';

const propTypes = {
	onChange: PropTypes.func.isRequired,
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* deprecated: title, html */
	/* html */
};

class LayoutEditorHtml extends Component {
	constructor(props) {
		super(props);
		this.setText = this.setText.bind(this);
	}

	setText(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			html: evt.target.value,
		});
	}

	render() {
		return (
			<div className="layout-editor-html-component">
				<div className="block-header" />

				<div className="block-content">
					<div className="container">
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
