import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

import Icon from 'components/Icon/Icon';
import { renderLatexString } from 'client/utils/editor';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	changeNode: PropTypes.func.isRequired,
	selectedNode: PropTypes.object.isRequired,
	editorChangeObject: PropTypes.object.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

class ControlsEquation extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isEditing: false,
			editingValue: '',
		};
		this.handleFocus = this.handleFocus.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
		this.handleValueChange = this.handleValueChange.bind(this);
		this.handleHTMLChange = this.handleHTMLChange.bind(this);
		this.changeToInline = this.changeToInline.bind(this);
		this.changeToBlock = this.changeToBlock.bind(this);
	}

	handleFocus() {
		this.setState({
			isEditing: true,
			editingValue: this.props.attrs.value,
		});
	}

	handleBlur() {
		this.setState({
			isEditing: false,
		});
	}

	handleValueChange(evt) {
		this.setState({ editingValue: evt.target.value });
		const isBlock = this.props.selectedNode.type.name === 'block_equation';
		renderLatexString(evt.target.value, isBlock, this.handleHTMLChange);
	}

	handleHTMLChange(html) {
		this.props.updateAttrs({ value: this.state.editingValue, html: html });
	}

	changeToInline() {
		const isBlock = this.props.selectedNode.type.name === 'block_equation';
		if (isBlock) {
			const nodeType = this.props.editorChangeObject.view.state.schema.nodes.equation;
			renderLatexString(this.props.attrs.value, false, (newHtml) => {
				this.props.changeNode(
					nodeType,
					{
						value: this.props.attrs.value,
						html: newHtml,
					},
					null,
				);
			});
		}
	}

	changeToBlock() {
		const isBlock = this.props.selectedNode.type.name === 'block_equation';
		if (!isBlock) {
			const nodeType = this.props.editorChangeObject.view.state.schema.nodes.block_equation;
			renderLatexString(this.props.attrs.value, true, (newHtml) => {
				this.props.changeNode(
					nodeType,
					{
						value: this.props.attrs.value,
						html: newHtml,
					},
					null,
				);
			});
		}
	}

	render() {
		// <div>TODO: Not all of these are equations. Rename it to 'math'</div>
		const isBlock = this.props.selectedNode.type.name === 'block_equation';
		const iconSize = this.props.isSmall ? 12 : 16;

		return (
			<div
				className={`formatting-bar_controls-component ${this.props.isSmall ? 'small' : ''}`}
			>
				{/*  LaTex Adjustment */}
				<div className="block">
					<div className="label">LaTeX</div>
					<div className="input wide">
						<textarea
							placeholder="Enter LaTeX math"
							className="bp3-input bp3-fill"
							value={
								this.state.isEditing
									? this.state.editingValue
									: this.props.attrs.value
							}
							onFocus={this.handleFocus}
							onBlur={this.handleBlur}
							onChange={this.handleValueChange}
						/>
					</div>
				</div>

				{/*  Display Adjustment */}
				<div className="block">
					<div className="label">Display</div>
					<div className="input">
						<Button
							onClick={this.changeToInline}
							text="Inline"
							icon={<Icon icon="align-left" iconSize={iconSize} />}
							active={!isBlock}
						/>
						<Button
							onClick={this.changeToBlock}
							text="Block"
							icon={<Icon icon="align-justify" iconSize={iconSize} />}
							active={isBlock}
						/>
					</div>
				</div>
			</div>
		);
	}
}

ControlsEquation.propTypes = propTypes;
export default ControlsEquation;
