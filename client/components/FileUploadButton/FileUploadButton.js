import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';
import { s3Upload } from 'client/utils/upload';

require('./fileUploadButton.scss');

const propTypes = {
	onUploadFinish: PropTypes.func.isRequired,
	text: PropTypes.string,
	icon: PropTypes.string,
	isLarge: PropTypes.bool,
	isSmall: PropTypes.bool,
	isMinimal: PropTypes.bool,
	className: PropTypes.string,
	accept: PropTypes.string,
};

const defaultProps = {
	text: undefined,
	icon: undefined,
	isLarge: false,
	isSmall: false,
	isMinimal: false,
	className: '',
	accept: undefined,
};

class FileUploadButton extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isUploading: false,
		};
		this.randKey = Math.round(Math.random() * 99999);
		this.handleUploadFinish = this.handleUploadFinish.bind(this);
		this.handleFileSelect = this.handleFileSelect.bind(this);
	}

	handleUploadFinish(evt, index, type, filename) {
		this.props.onUploadFinish(`https://assets.pubpub.org/${filename}`);
		this.setState({
			isUploading: false,
		});
	}

	handleFileSelect(evt) {
		if (evt.target.files.length) {
			s3Upload(evt.target.files[0], () => {}, this.handleUploadFinish, 0);
			this.setState({
				isUploading: true,
			});
		}
	}

	render() {
		const { text, icon, isLarge, isSmall, isMinimal, className, accept } = this.props;
		return (
			<div className={`file-upload-button-component ${className}`}>
				<Button
					className="upload-button"
					text={
						<React.Fragment>
							{text}
							<label htmlFor={this.randKey} className="file-select">
								<input
									id={this.randKey}
									name="file-input"
									type="file"
									accept={accept}
									onChange={this.handleFileSelect}
									className="file-input"
								/>
							</label>
						</React.Fragment>
					}
					icon={icon ? <Icon icon={icon} /> : null}
					large={isLarge}
					small={isSmall}
					minimal={isMinimal}
					loading={this.state.isUploading}
				/>
			</div>
		);
	}
}

FileUploadButton.propTypes = propTypes;
FileUploadButton.defaultProps = defaultProps;
export default FileUploadButton;
