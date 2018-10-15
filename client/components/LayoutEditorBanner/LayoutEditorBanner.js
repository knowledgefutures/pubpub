import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Button } from '@blueprintjs/core';
import TagMultiSelect from 'components/TagMultiSelect/TagMultiSelect';
import { getResizedUrl } from 'utilities';

require('./layoutEditorBanner.scss');

const propTypes = {
	onChange: PropTypes.func.isRequired,
	onRemove: PropTypes.func.isRequired,
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	communityData: PropTypes.object.isRequired,
	/* Expected content */
	/* text, align, backgroundColor, backgroundImage, backgroundSize, showButton, buttonText, defaultTagIds */
};

class LayoutEditorBanner extends Component {
	constructor(props) {
		super(props);
		this.state = {
			key: new Date().getTime(),
		};
		this.handleRemove = this.handleRemove.bind(this);
		this.setAlign = this.setAlign.bind(this);
		this.setBackgroundSize = this.setBackgroundSize.bind(this);
		this.setBackgroundColor = this.setBackgroundColor.bind(this);
		this.setBackgroundImage = this.setBackgroundImage.bind(this);
		this.setDefaultTagIds = this.setDefaultTagIds.bind(this);
		this.setText = this.setText.bind(this);
		this.setShowButton = this.setShowButton.bind(this);
		this.setButtonText = this.setButtonText.bind(this);
	}

	setAlign(alignValue) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			align: alignValue, /* left or center */
		});
	}

	setBackgroundSize(backgroundSizeValue) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			backgroundSize: backgroundSizeValue /* full or standard */
		});
	}

	setBackgroundColor(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			backgroundColor: evt.target.value,
		});
	}

	setBackgroundImage(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			backgroundImage: evt.target.value,
		});
	}

	setText(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			text: evt.target.value,
		});
	}

	setShowButton(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			showButton: evt.target.checked,
		});
	}

	setButtonText(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			buttonText: evt.target.value,
		});
	}

	setDefaultTagIds(newTagIds) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			defaultTagIds: newTagIds,
		});
	}

	handleRemove() {
		this.props.onRemove(this.props.layoutIndex);
	}

	render() {
		const backgroundImageCss = this.props.content.backgroundImage
			? `url("${getResizedUrl(this.props.content.backgroundImage, 'fit-in', '1500x600')}")`
			: undefined;

		const textStyle = {
			textAlign: this.props.content.align || 'left',
			color: 'white',
			fontSize: '40px',
			lineHeight: '1em',
		};
		const backgroundStyle = {
			backgroundColor: this.props.content.backgroundColor,
			backgroundImage: backgroundImageCss,
			minHeight: '200px',
			display: 'flex',
			alignItems: 'center',
		};

		return (
			<div className="layout-editor-banner-component">
				<div className="block-header">
					<div className="pt-form-group">
						<label htmlFor={`section-title-${this.props.layoutIndex}`}>
							Text
						</label>
						<input
							id={`section-title-${this.props.layoutIndex}`}
							type="text"
							className="pt-input"
							value={this.props.content.text}
							onChange={this.setText}
						/>
					</div>
					<div className="spacer" />
					<div className="pt-form-group">
						<label htmlFor={`section-title-${this.props.layoutIndex}`}>
							Background Color
						</label>
						<input
							id={`section-title-${this.props.layoutIndex}`}
							type="text"
							className="pt-input"
							value={this.props.content.backgroundColor}
							onChange={this.setBackgroundColor}
						/>
					</div>
					<div className="pt-form-group">
						<label htmlFor={`section-title-${this.props.layoutIndex}`}>
							Background Image
						</label>
						<input
							id={`section-title-${this.props.layoutIndex}`}
							type="text"
							className="pt-input"
							value={this.props.content.backgroundImage}
							onChange={this.setBackgroundImage}
						/>
					</div>
					<div className="pt-form-group">
						<label htmlFor={`section-size-${this.props.layoutIndex}`}>
							Align
						</label>
						<div className="pt-button-group">
							<button
								type="button"
								className={`pt-button ${this.props.content.align === 'left' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setAlign('left');
								}}
							>
								Left
							</button>
							<button
								type="button"
								className={`pt-button ${this.props.content.align === 'center' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setAlign('center');
								}}
							>
								Center
							</button>
						</div>
					</div>
					<div className="pt-form-group">
						<label htmlFor={`section-limit-${this.props.layoutIndex}`}>
							Background Size
						</label>
						<div className="pt-button-group">
							<button
								type="button"
								className={`pt-button ${this.props.content.backgroundSize === 'full' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setBackgroundSize('full');
								}}
							>
								Full
							</button>
							<button
								type="button"
								className={`pt-button ${this.props.content.backgroundSize === 'standard' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setBackgroundSize('standard');
								}}
							>
								Standard
							</button>
						</div>
					</div>
					<div className="pt-form-group">
						<label htmlFor={`section-title-${this.props.layoutIndex}`}>
							Create Pub Button
						</label>
						<Checkbox
							checked={this.props.content.showButton}
							onChange={this.setShowButton}
						>
							Show Button
						</Checkbox>
					</div>
					{this.props.content.showButton &&
						<div className="pt-form-group">
							<label htmlFor={`section-title-${this.props.layoutIndex}`}>
								Button Text
							</label>
							<input
								id={`section-title-${this.props.layoutIndex}`}
								type="text"
								className="pt-input"
								value={this.props.content.buttonText}
								onChange={this.setButtonText}
							/>
						</div>
					}
					{this.props.content.showButton &&
						<div className="pt-form-group">
							<label htmlFor={`section-tag-${this.props.layoutIndex}`}>Default Pub Tags</label>
							<div className="pt-button-group pt-select">
								<TagMultiSelect
									allTags={this.props.communityData.tags}
									selectedTagIds={this.props.content.defaultTagIds || []}
									onItemSelect={(newTagId)=> {
										const existingTagIds = this.props.content.defaultTagIds || [];
										const newTagIds = [...existingTagIds, newTagId];
										this.setDefaultTagIds(newTagIds);
									}}
									onRemove={(evt, tagIndex)=> {
										const existingTagIds = this.props.content.defaultTagIds || [];
										const newTagIds = existingTagIds.filter((item, filterIndex)=> {
											return filterIndex !== tagIndex;
										});
										this.setDefaultTagIds(newTagIds);
									}}
									placeholder="Default Pub Tags..."
								/>
							</div>
						</div>
					}
					<div className="pt-form-group">
						<div className="pt-button-group">
							<button
								type="button"
								className="pt-button pt-icon-trash"
								onClick={this.handleRemove}
							/>
						</div>
					</div>
				</div>

				<div className="block-content" style={this.props.content.backgroundSize === 'full' ? backgroundStyle : undefined}>
					<div className="container">
						<div className="row" style={this.props.content.backgroundSize === 'standard' ? backgroundStyle : undefined}>
							<div className="col-12" style={textStyle}>
								{this.props.content.text &&
									<h2>
										{this.props.content.text}
									</h2>
								}
								{this.props.content.showButton &&
									<Button
										className="pt-large"
										onClick={()=>{}}
										text={this.props.content.buttonText || 'Create Pub'}
									/>
								}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

LayoutEditorBanner.propTypes = propTypes;
export default LayoutEditorBanner;
