import React, { Component } from 'react';
import { Spinner } from '@blueprintjs/core';
import Dropzone from 'react-dropzone';
import filesize from 'filesize';

import Icon from 'components/Icon/Icon';
import { s3Upload } from 'client/utils/upload';

type Props = {
	onInsert: (...args: any[]) => any;
	isSmall: boolean;
};

type State = any;

class MediaFile extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			isUploading: false,
			progress: 0,
			loadingFileName: '',
			loadingFileSize: '',
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
				loadingFileName: files[0].name,
				loadingFileSize: filesize(files[0].size, { round: 0 }),
			});
		}
	}

	onUploadProgress(evt) {
		this.setState({
			progress: evt.loaded / evt.total,
		});
	}

	onUploadFinish(evt, index, type, filename) {
		this.props.onInsert('file', {
			url: `https://assets.pubpub.org/${filename}`,
			fileName: this.state.loadingFileName,
			fileSize: this.state.loadingFileSize,
		});
	}

	render() {
		return (
			<Dropzone onDrop={this.onDrop}>
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
									<div className="drag-title">Drag & drop to upload a File</div>
									<div className="drag-details">Or click to browse files</div>
								</div>
							)}
							{this.state.isUploading && (
								<div className="drag-message">
									<Spinner value={this.state.progress} />
								</div>
							)}
						</div>
					);
				}}
			</Dropzone>
		);
	}
}
export default MediaFile;
