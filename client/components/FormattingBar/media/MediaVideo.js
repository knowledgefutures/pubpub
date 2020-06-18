import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@blueprintjs/core';
import Dropzone from 'react-dropzone';

import Icon from 'components/Icon/Icon';
import { s3Upload } from 'client/utils/upload';

const propTypes = {
	onInsert: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

class MediaVideo extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isUploading: false,
			progress: 0,
		};
		this.onDrop = this.onDrop.bind(this);
		this.onUploadFinish = this.onUploadFinish.bind(this);
		this.onUploadProgress = this.onUploadProgress.bind(this);
	}

	onDrop(files) {
		if (files.length) {
			s3Upload(files[0], this.onUploadProgress, this.onUploadFinish, 0);
			this.setState({
				isUploading: true,
			});
		}
	}

	onUploadProgress(evt) {
		this.setState({
			progress: evt.loaded / evt.total,
		});
	}

	onUploadFinish(evt, index, type, filename) {
		this.props.onInsert('video', {
			url: `https://assets.pubpub.org/${filename}`,
			align: this.props.isSmall ? 'full' : undefined,
		});
	}

	render() {
		return (
			<Dropzone onDrop={this.onDrop} accept="video/mp4, video/webm">
				{({ getRootProps, getInputProps, isDragActive }) => {
					return (
						<div
							{...getRootProps()}
							className={`formatting-bar_media-component-content dropzone ${
								isDragActive ? 'dropzone--isActive' : ''
							}`}
						>
							<input {...getInputProps()} />
							{!this.state.isUploading && (
								<div className="drag-message">
									<Icon icon="circle-arrow-up" iconSize={50} />
									<div className="drag-title">Drag & drop to upload a Video</div>
									<div className="drag-details">Or click to browse files</div>
									<div className="drag-details">.mp4 or .webm</div>
								</div>
							)}
							{this.state.isUploading && (
								<div className="drag-message">
									<Spinner
										value={
											this.state.progress === 1 ? null : this.state.progress
										}
									/>
								</div>
							)}
						</div>
					);
				}}
			</Dropzone>
		);
	}
}

MediaVideo.propTypes = propTypes;
export default MediaVideo;
