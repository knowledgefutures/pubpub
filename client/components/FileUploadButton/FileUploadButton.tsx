import React, { Component } from 'react';
import { Button } from '@blueprintjs/core';
import { Icon, IconName } from 'components';
import { s3Upload } from 'client/utils/upload';

require('./fileUploadButton.scss');

type OwnProps = {
	onUploadFinish: (...args: any[]) => any;
	text: string;
	icon?: IconName;
	isLarge?: boolean;
	isSmall?: boolean;
	isMinimal?: boolean;
	className?: string;
	accept?: string;
};

const defaultProps = {
	isLarge: false,
	isSmall: false,
	isMinimal: false,
	className: '',
	accept: undefined,
};

type State = any;

type Props = OwnProps & typeof defaultProps;

class FileUploadButton extends Component<Props, State> {
	static defaultProps = defaultProps;

	randKey: string;

	constructor(props: Props) {
		super(props);
		this.state = {
			isUploading: false,
		};
		this.randKey = Math.round(Math.random() * 99999).toString();
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
							<label htmlFor={this.randKey} className="file-select">
								{text}
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
export default FileUploadButton;
