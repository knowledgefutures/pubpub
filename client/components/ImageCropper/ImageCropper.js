import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Slider } from '@blueprintjs/core';
import AvatarEditor from 'react-avatar-editor';

import { s3Upload } from 'client/utils/upload';

require('./imageCropper.scss');

const propTypes = {
	height: PropTypes.number,
	width: PropTypes.number,
	image: PropTypes.object,
	onCancel: PropTypes.func,
	onUploaded: PropTypes.func,
};

const defaultProps = {
	height: 200,
	width: 200,
	image: undefined,
	onCancel: () => {},
	onUploaded: () => {},
};

class ImageCropper extends Component {
	constructor(props) {
		super(props);
		this.state = {
			scale: 1.5,
			isUploading: false,
			blob: undefined,
		};
		this.editor = undefined;
		this.onFileFinish = this.onFileFinish.bind(this);
		this.handleScaleChange = this.handleScaleChange.bind(this);
		this.handleSaveClick = this.handleSaveClick.bind(this);
	}

	onFileFinish(evt, index, type, filename) {
		this.setState({
			isUploading: false,
			scale: 1.5,
		});
		this.props.onUploaded(`https://assets.pubpub.org/${filename}`, this.state.blob);
	}

	handleScaleChange(val) {
		this.setState({ scale: val });
	}

	handleSaveClick() {
		this.editor.getImage().toBlob(
			(blob) => {
				s3Upload(blob, () => {}, this.onFileFinish, 0);
				this.setState({
					isUploading: true,
					blob: URL.createObjectURL(blob),
				});
			},
			'image/jpeg',
			0.9,
		);
	}

	render() {
		if (typeof window === 'undefined') {
			return null;
		}
		return (
			<div className="image-cropper-component">
				<h5>Crop Image</h5>
				<div className="editor-wrapper">
					<AvatarEditor
						ref={(ref) => {
							this.editor = ref;
						}}
						image={this.props.image}
						width={this.props.width}
						height={this.props.height}
						border={0}
						scale={this.state.scale}
					/>
				</div>

				<Slider
					value={this.state.scale}
					onChange={this.handleScaleChange}
					min={1}
					max={5}
					stepSize={0.1}
					renderLabel={false}
				/>

				<div className="buttons">
					<Button text="Cancel" onClick={this.props.onCancel} />
					<Button
						text="Crop and Save"
						className="bp3-intent-primary"
						onClick={this.handleSaveClick}
						loading={this.state.isUploading}
					/>
				</div>
			</div>
		);
	}
}

ImageCropper.propTypes = propTypes;
ImageCropper.defaultProps = defaultProps;
export default ImageCropper;
