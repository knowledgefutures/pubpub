import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Editor, { getJSON } from '@pubpub/editor';
import { getResizedUrl } from 'utilities';

require('./layoutEditorText.scss');

const propTypes = {
	onChange: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	/* Expected content */
	/* title, align, width, text */
};

class LayoutEditorText extends Component {
	constructor(props) {
		super(props);
		this.state = {
			key: `text-block-${props.layoutIndex}`,
			initialContent: this.props.content.text || undefined,
		};
		this.handleRemove = this.handleRemove.bind(this);
		this.setAlignLeft = this.setAlignLeft.bind(this);
		this.setAlignCenter = this.setAlignCenter.bind(this);
		this.setWidthNarrow = this.setWidthNarrow.bind(this);
		this.setWidthWide = this.setWidthWide.bind(this);
		this.setText = this.setText.bind(this);
		this.changeTitle = this.changeTitle.bind(this);
		this.textChangesMade = false;
	}

	setAlignLeft() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			align: 'left'
		});
	}

	setAlignCenter() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			align: 'center'
		});
	}

	setWidthNarrow() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			width: 'narrow'
		});
	}

	setWidthWide() {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			width: 'wide'
		});
	}

	setText(textJSON) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			text: textJSON,
		});
	}

	handleRemove() {
		this.props.onRemove(this.props.layoutIndex);
	}

	changeTitle(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			title: evt.target.value,
		});
	}

	render() {
		const wrapperStyle = {
			textAlign: this.props.content.align || 'left',
			maxWidth: this.props.content.width === 'narrow' ? '800px' : 'none',
			margin: this.props.content.align === 'center' && this.props.content.width === 'narrow' ? '0 auto' : '0',
		};
		return (
			<div className="layout-editor-text-component">
				<div className="block-header">
					<div className="pt-form-group">
						<label htmlFor={`section-title-${this.props.layoutIndex}`}>Text Section Title</label>
						<input id={`section-title-${this.props.layoutIndex}`} type="text" className="pt-input" value={this.props.content.title} onChange={this.changeTitle} />
					</div>
					<div className="spacer" />
					<div className="pt-form-group">
						<label htmlFor={`section-size-${this.props.layoutIndex}`}>Align</label>
						<div className="pt-button-group">
							<button className={`pt-button ${this.props.content.align === 'left' ? 'pt-active' : ''}`} onClick={this.setAlignLeft}>Left</button>
							<button className={`pt-button ${this.props.content.align === 'center' ? 'pt-active' : ''}`} onClick={this.setAlignCenter}>Center</button>
						</div>
					</div>
					<div className="pt-form-group">
						<label htmlFor={`section-limit-${this.props.layoutIndex}`}>Width</label>
						<div className="pt-button-group">
							<button className={`pt-button ${this.props.content.width === 'narrow' ? 'pt-active' : ''}`} onClick={this.setWidthNarrow}>Narrow</button>
							<button className={`pt-button ${this.props.content.width === 'wide' ? 'pt-active' : ''}`} onClick={this.setWidthWide}>Wide</button>
						</div>
					</div>
					<div className="pt-form-group">
						<div className="pt-button-group">
							<button className="pt-button pt-icon-trash" onClick={this.handleRemove} />
						</div>
					</div>
				</div>

				<div className="block-content">
					<div className="container">
						{this.props.content.title &&
							<div className="row">
								<div className="col-12">
									<h2 className="block-title">{this.props.content.title}</h2>
								</div>
							</div>
						}

						<div className="row">
							<div className="col-12">
								<div style={wrapperStyle} id={String(this.state.key)}>
									<Editor
										nodeOptions={{
											image: {
												onResizeUrl: (url)=> { return getResizedUrl(url, 'fit-in', '1200x0'); },
											},
										}}
										placeholder="Enter text..."
										initialContent={this.state.initialContent}
										onChange={(editorChangeObject)=> {
											if (editorChangeObject.view.state.history$.prevTime) {
												/* history$.prevTime will be 0 if the transaction */
												/* does not generate an undo item in the history */
												this.textChangesMade = true;
											}
											if (this.textChangesMade) {
												this.setText(getJSON(editorChangeObject.view));
											}
										}}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

LayoutEditorText.propTypes = propTypes;
export default LayoutEditorText;
