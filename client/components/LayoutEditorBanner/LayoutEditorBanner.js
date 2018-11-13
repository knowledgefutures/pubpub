import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Button } from '@blueprintjs/core';
import TagMultiSelect from 'components/TagMultiSelect/TagMultiSelect';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import ColorInput from 'components/ColorInput/ColorInput';
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

	setBackgroundColor(colorObject) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			backgroundColor: colorObject.hex,
		});
	}

	setBackgroundImage(value) {
		console.log(value);
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			backgroundImage: value,
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
		const textStyle = {
			textAlign: this.props.content.align || 'left',
			color: 'white',
			fontSize: '40px',
			lineHeight: '1em',
		};

		const backgroundStyle = {
			backgroundColor: this.props.content.backgroundColor,
			backgroundImage: this.props.content.backgroundImage
				? `url("${getResizedUrl(this.props.content.backgroundImage, 'fit-in', '1500x600')}")`
				: undefined,
			textShadow: this.props.content.backgroundImage
				? '0 0 2px #000'
				: '',
			minHeight: '200px',
			display: 'flex',
			alignItems: 'center',
		};

		return (
			<div className="layout-editor-banner-component">
				<div className="block-header">
					<InputField
						label="Text"
						value={this.props.content.text}
						onChange={this.setText}
					/>
					<InputField label="Color">
						<ColorInput
							value={this.props.content.backgroundColor}
							onChange={this.setBackgroundColor}
						/>
					</InputField>
					<InputField label="Align">
						<div className="pt-button-group">
							<Button
								className={`${this.props.content.align === 'left' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setAlign('left');
								}}
								text="Left"
							/>
							<Button
								className={`${this.props.content.align === 'center' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setAlign('center');
								}}
								text="Center"
							/>
						</div>
					</InputField>
					<InputField label="Size">
						<div className="pt-button-group">
							<Button
								className={`${this.props.content.backgroundSize === 'full' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setBackgroundSize('full');
								}}
								text="Full"
							/>
							<Button
								className={`${this.props.content.backgroundSize === 'standard' ? 'pt-active' : ''}`}
								onClick={()=> {
									this.setBackgroundSize('standard');
								}}
								text="Standard"
							/>
						</div>
					</InputField>
					<ImageUpload
						label="Image"
						htmlFor={`section-title-${this.props.layoutIndex}`}
						defaultImage={this.props.content.backgroundImage}
						onNewImage={this.setBackgroundImage}
						canClear={true}
						width={50}
						height={35}
					/>

					<div className="line-break" />

					<InputField label="Create Pub Button">
						<Checkbox
							checked={this.props.content.showButton}
							onChange={this.setShowButton}
						>
							Show Button
						</Checkbox>
					</InputField>

					{this.props.content.showButton &&
						<InputField
							label="Button Text"
							value={this.props.content.buttonText}
							onChange={this.setButtonText}
						/>
					}
					{this.props.content.showButton &&
						<InputField label="Default Pub Tags">
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
						</InputField>
					}
				</div>

				<div className="block-content" style={this.props.content.backgroundSize === 'full' ? backgroundStyle : undefined}>
					{this.props.content.backgroundImage && this.props.content.backgroundSize === 'full' &&
						<div className="dim" />
					}
					<div className="container">
						<div className="row" style={this.props.content.backgroundSize === 'standard' ? backgroundStyle : undefined}>
							{this.props.content.backgroundImage && this.props.content.backgroundSize === 'standard' &&
								<div className="dim" />
							}
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
