import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AnchorButton } from '@blueprintjs/core';
import Overlay from 'components/Overlay/Overlay';
import ImageCropper from 'components/ImageCropper/ImageCropper';
import Icon from 'components/Icon/Icon';
import { s3Upload } from 'utilities';

require('./imageUpload.scss');

const propTypes = {
	defaultImage: PropTypes.string,
	useCrop: PropTypes.bool,
	width: PropTypes.number,
	height: PropTypes.number,
	label: PropTypes.node,
	isRequired: PropTypes.bool,
	helperText: PropTypes.node,
	htmlFor: PropTypes.string,
	onNewImage: PropTypes.func,
	canClear: PropTypes.bool,
	useAccentBackground: PropTypes.bool,
};

const defaultProps = {
	defaultImage: undefined,
	useCrop: false,
	width: 75,
	height: 75,
	label: undefined,
	isRequired: false,
	helperText: undefined,
	htmlFor: String(new Date().getTime()),
	onNewImage: () => {},
	canClear: false,
	useAccentBackground: false,
};

class ImageUpload extends Component {
	constructor(props) {
		super(props);
		this.state = {
			imageFile: undefined,
			imageBlob: this.props.defaultImage,
			uploading: false,
		};
		this.onUploadFinish = this.onUploadFinish.bind(this);
		this.onCropUploaded = this.onCropUploaded.bind(this);
		this.setBlob = this.setBlob.bind(this);
		this.handleImageSelect = this.handleImageSelect.bind(this);
		this.clearImage = this.clearImage.bind(this);
		this.cancelImageUpload = this.cancelImageUpload.bind(this);
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

	handleImageSelect(evt) {
		if (evt.target.files.length && this.props.useCrop) {
			this.setState({ imageFile: evt.target.files[0] });
		}

		if (evt.target.files.length && !this.props.useCrop) {
			s3Upload(evt.target.files[0], () => {}, this.onUploadFinish, 0);
			this.setState({
				uploading: true,
			});
			this.setBlob(evt.target.files[0]);
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

	render() {
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
				<label htmlFor={`input-${this.props.htmlFor}`}>
					{this.props.label}
					{this.props.isRequired && (
						<span className="bp3-text-muted required-text"> (required)</span>
					)}
					<br />

					{(this.state.uploading || !this.state.imageBlob) && (
						<AnchorButton
							className="upload-button bp3-minimal"
							style={buttonStyle}
							loading={this.state.uploading}
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
							<AnchorButton className="bp3-minimal" icon={<Icon icon="edit2" />} />
						)}
						{!this.state.uploading && this.state.imageBlob && (
							<AnchorButton
								className="bp3-minimal"
								href={this.state.imageBlob}
								target="_blank"
								icon="download"
								download
							/>
						)}
						{!this.state.uploading && this.state.imageBlob && this.props.canClear && (
							<AnchorButton
								className="bp3-minimal bp3-intent-danger"
								icon="trash"
								onClick={this.clearImage}
							/>
						)}
					</div>
					<input
						id={`input-${this.props.htmlFor}`}
						name="logo image"
						type="file"
						accept="image/png, image/jpeg"
						onChange={this.handleImageSelect}
					/>
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
}

ImageUpload.propTypes = propTypes;
ImageUpload.defaultProps = defaultProps;
export default ImageUpload;
