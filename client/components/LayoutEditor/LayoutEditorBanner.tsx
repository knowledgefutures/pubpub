import React, { Component } from 'react';
import Color from 'color';
import { Button, ButtonGroup, Classes } from '@blueprintjs/core';

import CollectionMultiSelect from 'components/CollectionMultiSelect/CollectionMultiSelect';
import InputField from 'components/InputField/InputField';
import ImageUpload from 'components/ImageUpload/ImageUpload';
import ColorInput from 'components/ColorInput/ColorInput';
import { getResizedUrl } from 'utils/images';
import { getButtonText } from '../Layout/LayoutBanner';

require('./layoutEditorBanner.scss');

type Props = {
	onChange: (...args: any[]) => any;
	layoutIndex: number;
	content: any;
	communityData: any;
};

class LayoutEditorBanner extends Component<Props> {
	constructor(props: Props) {
		super(props);
		this.setAlign = this.setAlign.bind(this);
		this.setBackgroundSize = this.setBackgroundSize.bind(this);
		this.setBackgroundHeight = this.setBackgroundHeight.bind(this);
		this.setBackgroundColor = this.setBackgroundColor.bind(this);
		this.setBackgroundImage = this.setBackgroundImage.bind(this);
		this.setDefaultCollectionIds = this.setDefaultCollectionIds.bind(this);
		this.setText = this.setText.bind(this);
		this.setShowButton = this.setShowButton.bind(this);
		this.setButtonType = this.setButtonType.bind(this);
		this.setButtonText = this.setButtonText.bind(this);
		this.setButtonUrl = this.setButtonUrl.bind(this);
	}

	setAlign(alignValue) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			align: alignValue /* left or center */,
		});
	}

	setBackgroundSize(backgroundSizeValue) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			backgroundSize: backgroundSizeValue /* full or standard */,
		});
	}

	setBackgroundHeight(backgroundHeightValue) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			backgroundHeight: backgroundHeightValue /* tall or narrow */,
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
			buttonType,
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

	setDefaultCollectionIds(newCollectionIds) {
		this.props.onChange(this.props.layoutIndex, {
			...this.props.content,
			defaultCollectionIds: newCollectionIds,
		});
	}

	render() {
		const backgroundImageCss = this.props.content.backgroundImage
			? `url("${getResizedUrl(this.props.content.backgroundImage, 'inside', 1500, 600)}")`
			: undefined;

		const wrapperStyle = {
			textAlign: this.props.content.align || 'left',
		};
		const textStyle = {
			color:
				this.props.content.backgroundImage ||
				!Color(this.props.content.backgroundColor).isLight()
					? '#FFFFFF'
					: '#000000',
			lineHeight: '1em',
			fontSize: this.props.content.backgroundHeight === 'narrow' ? '18px' : '28px',
		};

		const backgroundStyle = {
			backgroundColor: this.props.content.backgroundColor,
			backgroundImage: backgroundImageCss,
			textShadow: this.props.content.backgroundImage ? '0 0 2px #000' : '',
			minHeight: this.props.content.backgroundHeight === 'narrow' ? '60px' : '200px',
			display: 'flex',
			alignItems: 'center',
			maxWidth: 'none',
		};

		const buttonType =
			this.props.content.buttonType || (this.props.content.showButton && 'create-pub');
		const buttonText = getButtonText(buttonType, this.props.content.buttonText);

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
						<ButtonGroup>
							<Button
								active={this.props.content.align === 'left'}
								onClick={() => {
									this.setAlign('left');
								}}
								text="Left"
							/>
							<Button
								active={this.props.content.align === 'center'}
								onClick={() => {
									this.setAlign('center');
								}}
								text="Center"
							/>
						</ButtonGroup>
					</InputField>
					<InputField label="Size">
						<ButtonGroup>
							<Button
								active={this.props.content.backgroundSize === 'full'}
								onClick={() => {
									this.setBackgroundSize('full');
								}}
								text="Full"
							/>
							<Button
								active={this.props.content.backgroundSize === 'standard'}
								onClick={() => {
									this.setBackgroundSize('standard');
								}}
								text="Standard"
							/>
						</ButtonGroup>
					</InputField>
					<InputField label="Height">
						<ButtonGroup>
							<Button
								active={this.props.content.backgroundHeight === 'tall'}
								onClick={() => {
									this.setBackgroundHeight('tall');
								}}
								text="Tall"
							/>
							<Button
								active={this.props.content.backgroundHeight === 'narrow'}
								onClick={() => {
									this.setBackgroundHeight('narrow');
								}}
								text="Narrow"
							/>
						</ButtonGroup>
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
						<div className={`${Classes.BUTTON_GROUP} ${Classes.SELECT}`}>
							<select value={buttonType} onChange={this.setButtonType}>
								<option value="none">None</option>
								<option value="create-pub">Create Pub</option>
								<option value="signup">Create Account</option>
								<option value="link">Link</option>
							</select>
						</div>
					</InputField>

					{this.props.content.showButton && (
						<InputField
							label="Button Text"
							value={this.props.content.buttonText}
							onChange={this.setButtonText}
						/>
					)}
					{this.props.content.showButton && buttonType === 'create-pub' && (
						<InputField label="Default Pub Collections">
							<CollectionMultiSelect
								allCollections={this.props.communityData.collections}
								selectedCollectionIds={
									this.props.content.defaultCollectionIds || []
								}
								onItemSelect={(newCollectionId) => {
									const existingCollectionIds =
										this.props.content.defaultCollectionIds || [];
									const newCollectionIds = [
										...existingCollectionIds,
										newCollectionId,
									];
									this.setDefaultCollectionIds(newCollectionIds);
								}}
								onRemove={(evt, collectionIndex) => {
									const existingCollectionIds =
										this.props.content.defaultCollectionIds || [];
									const newCollectionIds = existingCollectionIds.filter(
										(item, filterIndex) => {
											return filterIndex !== collectionIndex;
										},
									);
									this.setDefaultCollectionIds(newCollectionIds);
								}}
								placeholder="Add collections..."
							/>
						</InputField>
					)}
					{this.props.content.showButton && buttonType === 'link' && (
						<InputField
							label="Link"
							value={this.props.content.buttonUrl}
							onChange={this.setButtonUrl}
						/>
					)}
				</div>

				<div
					className="block-content"
					style={
						this.props.content.backgroundSize === 'full' ? backgroundStyle : undefined
					}
				>
					{this.props.content.backgroundImage &&
						this.props.content.backgroundSize === 'full' && <div className="dim" />}
					<div className="container">
						<div
							className="row"
							style={
								this.props.content.backgroundSize === 'standard'
									? backgroundStyle
									: undefined
							}
						>
							{this.props.content.backgroundImage &&
								this.props.content.backgroundSize === 'standard' && (
									<div className="dim" />
								)}
							<div className="col-12" style={wrapperStyle}>
								{this.props.content.text && (
									<h2 style={textStyle}>{this.props.content.text}</h2>
								)}
								{this.props.content.showButton && (
									<Button
										className={Classes.LARGE}
										onClick={() => {}}
										text={buttonText}
									/>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default LayoutEditorBanner;
