import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Slider, AnchorButton, ButtonGroup, Button } from '@blueprintjs/core';

import SimpleEditor from 'components/SimpleEditor/SimpleEditor';
import Icon from 'components/Icon/Icon';
import { s3Upload } from 'client/utils/upload';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

class ControlsVideo extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isUploading: false,
		};
		this.randKey = Math.round(Math.random() * 99999);
		this.onUploadFinish = this.onUploadFinish.bind(this);
		this.handleVideoSelect = this.handleVideoSelect.bind(this);
	}

	onUploadFinish(evt, index, type, filename) {
		this.props.updateAttrs({ url: `https://assets.pubpub.org/${filename}` });
		this.setState({
			isUploading: false,
		});
	}

	handleVideoSelect(evt) {
		if (evt.target.files.length) {
			s3Upload(evt.target.files[0], () => {}, this.onUploadFinish, 0);
			this.setState({
				isUploading: true,
			});
		}
	}

	render() {
		const alignOptions = [
			{ key: 'left', icon: 'align-left' },
			{ key: 'center', icon: 'align-center' },
			{ key: 'right', icon: 'align-right' },
			{ key: 'full', icon: 'vertical-distribution' },
			{ key: 'breakout', icon: 'fullscreen' },
		];
		const iconSize = this.props.isSmall ? 12 : 16;

		return (
			<div
				className={`formatting-bar_controls-component ${this.props.isSmall ? 'small' : ''}`}
			>
				{/*  Size Adjustment */}
				<div className="block hide-on-small">
					<div className="label">Size</div>
					<div className="input">
						<Slider
							min={20}
							max={100}
							value={this.props.attrs.size}
							onChange={(newSize) => {
								this.props.updateAttrs({ size: newSize });
							}}
							labelRenderer={false}
							disabled={this.props.attrs.align === 'full'}
						/>
					</div>
				</div>

				{/*  Alignment Adjustment */}
				<div className="block hide-on-small">
					<div className="label over-buttons">Alignment</div>
					<div className="input">
						<ButtonGroup>
							{alignOptions.map((item) => {
								return (
									<Button
										key={item.key}
										icon={<Icon icon={item.icon} iconSize={iconSize} />}
										minimal={true}
										active={this.props.attrs.align === item.key}
										onClick={() => {
											this.props.updateAttrs({ align: item.key });
										}}
									/>
								);
							})}
						</ButtonGroup>
					</div>
				</div>

				{/*  Caption Adjustment */}
				<div className="block">
					<div className="label">Caption</div>
					<div className="input wide">
						<div className="simple-editor-wrapper">
							<SimpleEditor
								initialHtmlString={this.props.attrs.caption}
								onChange={(htmlString) => {
									this.props.updateAttrs({ caption: htmlString });
								}}
								placeholder="Enter caption..."
							/>
						</div>
					</div>
				</div>

				{/*  Source Details */}
				<div className="block">
					<div className="label over-buttons">Source</div>
					<div className="input">
						<ButtonGroup>
							<AnchorButton
								icon={<Icon icon="download" iconSize={iconSize} />}
								minimal={true}
								href={this.props.attrs.url}
								target="_blank"
								rel="noopener noreferrer"
							/>
							<label htmlFor={this.randKey} className="file-select">
								<AnchorButton
									icon={<Icon icon="edit2" iconSize={iconSize} />}
									minimal={true}
									loading={this.state.isUploading}
								/>
								<input
									id={this.randKey}
									name="video"
									type="file"
									accept="video/mp4, video/webm"
									onChange={this.handleVideoSelect}
									className="file-input"
								/>
							</label>
						</ButtonGroup>
					</div>
				</div>
			</div>
		);
	}
}

ControlsVideo.propTypes = propTypes;
export default ControlsVideo;
