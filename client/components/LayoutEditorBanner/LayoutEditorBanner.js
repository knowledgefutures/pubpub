import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import TagMultiSelect from 'components/TagMultiSelect/TagMultiSelect';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import ColorInput from 'components/ColorInput/ColorInput';
import { getResizedUrl } from 'utilities';

require('./layoutEditorBanner.scss');

const propTypes = {
	onChange: PropTypes.func.isRequired,
	layoutIndex: PropTypes.number.isRequired,
	content: PropTypes.object.isRequired,
	communityData: PropTypes.object.isRequired,
	/* Expected content */
	/* text, align, backgroundColor, backgroundImage, backgroundSize, showButton, buttonType, buttonText, defaultTagIds, buttonUrl */
};

class LayoutEditorBanner extends Component {
	constructor(props) {
		super(props);
		this.setAlign = this.setAlign.bind(this);
		this.setBackgroundSize = this.setBackgroundSize.bind(this);
		this.setBackgroundColor = this.setBackgroundColor.bind(this);
		this.setBackgroundImage = this.setBackgroundImage.bind(this);
		this.setDefaultTagIds = this.setDefaultTagIds.bind(this);
		this.setText = this.setText.bind(this);
		this.setShowButton = this.setShowButton.bind(this);
		this.setButtonType = this.setButtonType.bind(this);
		this.setButtonText = this.setButtonText.bind(this);
		this.setButtonUrl = this.setButtonUrl.bind(this);
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

	setButtonType(evt) {
		const buttonType = evt.target.value;
		return this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			showButton: buttonType !== 'none',
			buttonType: buttonType
		});
	}

	setButtonText(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			buttonText: evt.target.value,
		});
	}

	setButtonUrl(evt) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			buttonUrl: evt.target.value,
		});
	}

	setDefaultTagIds(newTagIds) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			defaultTagIds: newTagIds,
		});
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

		const buttonType = this.props.content.buttonType || (this.props.content.showButton && 'create-pub');

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

					<InputField label="Banner Button Type">
						<div className="pt-button-group pt-select">
							<select value={buttonType} onChange={this.setButtonType}>
								<option value="none">None</option>
								<option value="create-pub">Create Pub</option>
								<option value="signup">Create Account</option>
								<option value="link">Link</option>
							</select>
						</div>
					</InputField>

					{this.props.content.showButton &&
						<InputField
							label="Button Text"
							value={this.props.content.buttonText}
							onChange={this.setButtonText}
						/>
					}
					{this.props.content.showButton && buttonType === 'create-pub' &&
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
					{this.props.content.showButton && buttonType === 'link' &&
						<InputField
							label="Link"
							value={this.props.content.buttonUrl}
							onChange={this.setButtonUrl}
						/>
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
										text={this.props.content.buttonText
											|| (buttonType === 'create-pub' && 'Create Pub')
											|| (buttonType === 'signup' && 'Create an Account')
											|| (buttonType === 'link' && 'Go to Link')
										}
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
