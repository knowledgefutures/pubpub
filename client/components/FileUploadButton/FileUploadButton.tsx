import React, { Component } from 'react';
import { Button } from '@blueprintjs/core';
import Icon from 'components/Icon/Icon';
import { s3Upload } from 'client/utils/upload';

require('./fileUploadButton.scss');

type OwnProps = {
	onUploadFinish: (...args: any[]) => any;
	text?: string;
	icon?: string;
	isLarge?: boolean;
	isSmall?: boolean;
	isMinimal?: boolean;
	className?: string;
	accept?: string;
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

type State = any;

type Props = OwnProps & typeof defaultProps;

class FileUploadButton extends Component<Props, State> {
	static defaultProps = defaultProps;

	constructor(props: Props) {
		super(props);
		this.state = {
			isUploading: false,
		};
		// @ts-expect-error ts-migrate(2339) FIXME: Property 'randKey' does not exist on type 'FileUpl... Remove this comment to see the full error message
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
							{/* @ts-expect-error ts-migrate(2339) FIXME: Property 'randKey' does not exist on type 'FileUpl... Remove this comment to see the full error message */}
							<label htmlFor={this.randKey} className="file-select">
								<input
									// @ts-expect-error ts-migrate(2339) FIXME: Property 'randKey' does not exist on type 'FileUpl... Remove this comment to see the full error message
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
					// @ts-expect-error ts-migrate(2322) FIXME: Type 'undefined' is not assignable to type 'string... Remove this comment to see the full error message
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
