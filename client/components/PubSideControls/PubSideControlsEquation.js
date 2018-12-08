import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import { renderLatexString } from 'utilities';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	changeNode: PropTypes.func.isRequired,
	selectedNode: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
};

class PubSideControlsEquation extends Component {
	constructor(props) {
		super(props);
		this.state = {
			value: props.attrs.value,
		};
		this.handleValueChange = this.handleValueChange.bind(this);
		this.handleHTMLChange = this.handleHTMLChange.bind(this);
		this.changeToInline = this.changeToInline.bind(this);
		this.changeToBlock = this.changeToBlock.bind(this);
	}

	handleValueChange(evt) {
		this.setState({ value: evt.target.value });
		const isBlock = this.props.selectedNode.type.name === 'block_equation';
		renderLatexString(evt.target.value, isBlock, this.handleHTMLChange);
	}

	handleHTMLChange(html) {
		this.props.updateAttrs({ value: this.state.value, html: html });
	}

	changeToInline() {
		const isBlock = this.props.selectedNode.type.name === 'block_equation';
		if (isBlock) {
			const nodeType = this.props.editorChangeObject.view.state.schema.nodes.equation;
			renderLatexString(this.state.value, false, (newHtml)=> {
				this.props.changeNode(nodeType, {
					value: this.props.attrs.value,
					html: newHtml,
				}, null);
			});
		}
	}

	changeToBlock() {
		const isBlock = this.props.selectedNode.type.name === 'block_equation';
		if (!isBlock) {
			const nodeType = this.props.editorChangeObject.view.state.schema.nodes.block_equation;
			renderLatexString(this.state.value, true, (newHtml)=> {
				this.props.changeNode(nodeType, {
					value: this.props.attrs.value,
					html: newHtml,
				}, null);
			});
		}
	}

	render() {
		// <div>TODO: Not all of these are equations. Rename it to 'math'</div>
		const isBlock = this.props.selectedNode.type.name === 'block_equation';

		return (
			<div className="pub-side-controls-citation-component">
				<div className="options-title">Equation Details</div>
				{/*  LaTex Adjustment */}
				<div className="form-label first">
					LaTeX
				</div>
				<textarea
					placeholder="Enter LaTeX math"
					className="bp3-input bp3-fill"
					value={this.props.attrs.value}
					onChange={this.handleValueChange}
				/>

				{/*  Display Adjustment */}
				<div className="form-label">
					Display
				</div>

				<div className="bp3-button-group bp3-fill">
					<Button
						className={`bp3-button bp3-icon-align-left ${!isBlock ? 'bp3-active' : ''}`}
						onClick={this.changeToInline}
						text="Inline"
					/>
					<Button
						className={`bp3-button bp3-icon-align-justify ${isBlock ? 'bp3-active' : ''}`}
						onClick={this.changeToBlock}
						text="Block"
					/>
				</div>
			</div>
		);
	}
}


PubSideControlsEquation.propTypes = propTypes;
export default PubSideControlsEquation;
