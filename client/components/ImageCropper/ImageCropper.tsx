import React, { Component } from 'react';
import { Button, Classes, Slider } from '@blueprintjs/core';
import AvatarEditor from 'react-avatar-editor';

import { s3Upload } from 'client/utils/upload';

require('./imageCropper.scss');

type OwnProps = {
	height?: number;
	width?: number;
	image?: any;
	onCancel?: (...args: any[]) => any;
	onUploaded?: (...args: any[]) => any;
};

const defaultProps = {
	height: 200,
	width: 200,
	image: undefined,
	onCancel: () => {},
	onUploaded: () => {},
};

type State = any;

type Props = OwnProps & typeof defaultProps;

class ImageCropper extends Component<Props, State> {
	static defaultProps = defaultProps;

	constructor(props: Props) {
		super(props);
		this.state = {
			scale: 1.5,
			isUploading: false,
			blob: undefined,
		};
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'editor' does not exist on type 'ImageCro... Remove this comment to see the full error message
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
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'editor' does not exist on type 'ImageCro... Remove this comment to see the full error message
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
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'editor' does not exist on type 'ImageCro... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type '{ value: any; onChange: (val: any) => void; ... Remove this comment to see the full error message
					renderLabel={false}
				/>

				<div className="buttons">
					<Button text="Cancel" onClick={this.props.onCancel} />
					<Button
						text="Crop and Save"
						className={Classes.INTENT_PRIMARY}
						onClick={this.handleSaveClick}
						loading={this.state.isUploading}
					/>
				</div>
			</div>
		);
	}
}
export default ImageCropper;
