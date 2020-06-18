import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';

import Overlay from 'components/Overlay/Overlay';
import ImageCropper from 'components/ImageCropper/ImageCropper';
import Icon from 'components/Icon/Icon';
import { s3Upload } from 'client/utils/upload';

require('./imageUpload.scss');

const propTypes = {
	canClear: PropTypes.bool,
	children: PropTypes.node,
	defaultImage: PropTypes.string,
	height: PropTypes.number,
	helperText: PropTypes.node,
	htmlFor: PropTypes.string,
	isRequired: PropTypes.bool,
	label: PropTypes.node,
	onNewImage: PropTypes.func,
	onImageSelect: PropTypes.func,
	useAccentBackground: PropTypes.bool,
	useCrop: PropTypes.bool,
	width: PropTypes.number,
};

const defaultProps = {
	canClear: false,
	children: null,
	defaultImage: undefined,
	height: 75,
	helperText: undefined,
	htmlFor: String(new Date().getTime()),
	isRequired: false,
	label: undefined,
	onNewImage: () => {},
	onImageSelect: () => {},
	useAccentBackground: false,
	useCrop: false,
	width: 75,
};

class ImageUpload extends Component {
	constructor(props) {
		super(props);
		this.state = {
			imageFile: undefined,
			imageBlob: this.props.defaultImage,
			uploading: false,
		};
		this.inputRef = React.createRef();
		this.onUploadFinish = this.onUploadFinish.bind(this);
		this.onCropUploaded = this.onCropUploaded.bind(this);
		this.setBlob = this.setBlob.bind(this);
		this.handleImageSelect = this.handleImageSelect.bind(this);
		this.clearImage = this.clearImage.bind(this);
		this.cancelImageUpload = this.cancelImageUpload.bind(this);
		this.openFileDialog = this.openFileDialog.bind(this);
	}

	onUploadFinish(evt, index, type, filename) {
		const newImageUrl = `https://assets.pubpub.org/${filename}`;
		this.setState({
			uploading: false,
		});
		this.props.onNewImage(newImageUrl);
	}

	onCropUploaded(newImageUrl, newImageBlob) {
		this.setState({
			imageFile: undefined,
			imageBlob: newImageBlob,
			uploading: false,
		});
		this.props.onNewImage(newImageUrl);
	}

	setBlob(image) {
		const reader = new FileReader();
		reader.onload = (imageBlob) => {
			this.setState({ imageBlob: imageBlob.target.result });
		};
		reader.readAsDataURL(image);
	}

	openFileDialog() {
		const { current: inputElement } = this.inputRef;
		if (inputElement) {
			inputElement.click();
		}
	}

	handleImageSelect(evt) {
		const { onImageSelect, useCrop } = this.props;
		const { files } = evt.target;
		if (files.length > 0) {
			const [imageFile] = files;
			if (useCrop) {
				this.setState({ imageFile: imageFile });
			} else {
				s3Upload(imageFile, () => {}, this.onUploadFinish, 0);
				this.setState({ uploading: true });
				this.setBlob(imageFile);
			}
			onImageSelect(imageFile);
		}
	}

	cancelImageUpload() {
		this.setState({
			imageFile: null,
			uploading: false,
		});
	}

	clearImage(evt) {
		evt.preventDefault();
		this.setState({
			imageFile: undefined,
			imageBlob: undefined,
			uploading: false,
		});
		this.props.onNewImage(null);
	}

	renderInput() {
		return (
			<input
				ref={this.inputRef}
				id={`input-${this.props.htmlFor}`}
				name="logo image"
				type="file"
				accept="image/png, image/jpeg"
				style={{ display: 'none' }}
				onChange={this.handleImageSelect}
			/>
		);
	}

	renderDefaultPicker() {
		const buttonStyle = {
			width: `${this.props.width}px`,
			height: `${this.props.height}px`,
		};
		const imageStyle = {
			...buttonStyle,
			backgroundImage: `url("${this.state.imageBlob}")`,
		};
		return (
			<div className="image-upload-component">
				{/* This label's target is properly nested, but rendered by renderInput() */}
				{/* eslint-disable-next-line jsx-a11y/label-has-for */}
				<label htmlFor={`input-${this.props.htmlFor}`}>
					{this.props.label}
					{this.props.isRequired && (
						<span className="bp3-text-muted required-text"> (required)</span>
					)}
					{this.props.label && <br />}

					{(this.state.uploading || !this.state.imageBlob) && (
						<AnchorButton
							className="upload-button bp3-minimal"
							style={buttonStyle}
							loading={this.state.uploading}
							title="Upload new header image"
							aria-label="Upload new header image"
							icon="media"
						/>
					)}

					{!this.state.uploading && this.state.imageBlob && (
						<div
							className={`image-wrapper ${
								this.props.useAccentBackground ? 'accent-background' : ''
							}`}
							style={imageStyle}
						/>
					)}

					<div className="image-options">
						{!this.state.uploading && this.state.imageBlob && (
							<AnchorButton
								className="bp3-minimal"
								title="Upload new header image"
								aria-label="Upload new header image"
								icon={<Icon icon="edit2" />}
							/>
						)}
						{!this.state.uploading && this.state.imageBlob && (
							<AnchorButton
								className="bp3-minimal"
								href={this.state.imageBlob}
								target="_blank"
								icon="download"
								title="Download header image"
								aria-label="Download header image"
								download
							/>
						)}
						{!this.state.uploading && this.state.imageBlob && this.props.canClear && (
							<AnchorButton
								className="bp3-minimal bp3-intent-danger"
								icon="trash"
								title="Remove header image"
								aria-label="Remove header image"
								onClick={this.clearImage}
							/>
						)}
					</div>
					{this.renderInput()}
				</label>
				<div className="helper-text">{this.props.helperText}</div>
				<Overlay
					maxWidth={300}
					isOpen={!!this.state.imageFile}
					onClose={this.cancelImageUpload}
				>
					<ImageCropper
						image={this.state.imageFile}
						onCancel={this.cancelImageUpload}
						onUploaded={this.onCropUploaded}
					/>
				</Overlay>
			</div>
		);
	}

	render() {
		const { children } = this.props;

		if (children) {
			return (
				<>
					{this.renderInput()}
					{children({
						selectImage: this.openFileDialog,
						clearImage: this.clearImage,
					})}
				</>
			);
		}

		return this.renderDefaultPicker();
	}
}

ImageUpload.propTypes = propTypes;
ImageUpload.defaultProps = defaultProps;
export default ImageUpload;
