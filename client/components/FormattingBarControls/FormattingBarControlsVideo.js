import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Slider, AnchorButton, ButtonGroup, Button } from '@blueprintjs/core';
import SimpleEditor from 'components/SimpleEditor/SimpleEditor';
import Icon from 'components/Icon/Icon';
import { s3Upload } from 'utilities';

const propTypes = {
	attrs: PropTypes.object.isRequired,
	updateAttrs: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

class FormattingBarControlsVideo extends Component {
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
		/* This timeout is due to S3 returning a 404 if we render the */
		/* video immediately after upload. S3 seems to have read-after-write */
		/* consistency - but I am still seeing problems with it. 500ms */
		/* seems to do the trick, but this is pretty hand-wavy. */
		setTimeout(()=> {
			this.props.updateAttrs({ url: `https://assets.pubpub.org/${filename}` });
			this.setState({
				isUploading: false,
			});
		}, 500);
	}

	handleVideoSelect(evt) {
		if (evt.target.files.length) {
			s3Upload(evt.target.files[0], ()=>{}, this.onUploadFinish, 0);
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
		];
		const iconSize = this.props.isSmall ? 12 : 16;

		return (
			<div className={`formatting-bar-controls-component ${this.props.isSmall ? 'small' : ''}`}>
				{/*  Size Adjustment */}
				<div className="block">
					<div className="label">Size</div>
					<div className="input">
						<Slider
							min={25}
							max={100}
							value={this.props.attrs.size}
							onChange={(newSize)=> {
								this.props.updateAttrs({ size: newSize });
							}}
							labelRenderer={false}
							disabled={this.props.attrs.align === 'full'}
						/>
					</div>
				</div>

				{/*  Alignment Adjustment */}
				<div className="block">
					<div className="label over-buttons">Alignment</div>
					<div className="input">
						<ButtonGroup>
							{alignOptions.map((item)=> {
								return (
									<Button
										key={item.key}
										icon={<Icon icon={item.icon} iconSize={iconSize} />}
										minimal={true}
										active={this.props.attrs.align === item.key}
										onClick={()=> { this.props.updateAttrs({ align: item.key }); }}
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
								onChange={(htmlString)=> {
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


FormattingBarControlsVideo.propTypes = propTypes;
export default FormattingBarControlsVideo;
