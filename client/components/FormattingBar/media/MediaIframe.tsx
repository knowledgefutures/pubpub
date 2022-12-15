import React, { Component } from 'react';
import { InputGroup, Button, Intent, NonIdealState } from '@blueprintjs/core';
import { isHttpsUri } from 'valid-url';

import { getIframeSrc } from 'client/utils/editor';

type Props = {
	onInsert: (...args: any[]) => any;
	isSmall: boolean;
};

type State = any;

class MediaIframe extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			url: '',
		};
		this.handleInsert = this.handleInsert.bind(this);
	}

	handleInsert() {
		this.props.onInsert('iframe', {
			url: this.state.url,
			align: this.props.isSmall ? 'full' : undefined,
		});
	}

	render() {
		const isValid = isHttpsUri(this.state.url);
		return (
			<div className="formatting-bar_media-component-content">
				<InputGroup
					className="top-input"
					fill={true}
					placeholder="Enter URL"
					value={this.state.url}
					large={true}
					onChange={(evt) => {
						const val = evt.target.value;
						this.setState({ url: getIframeSrc(val) || val });
					}}
					rightElement={
						<Button
							text="Insert"
							intent={Intent.PRIMARY}
							disabled={!isValid}
							large={true}
							onClick={this.handleInsert}
						/>
					}
				/>
				{isValid && (
					<div className="preview-wrapper">
						<iframe
							frameBorder="none"
							src={this.state.url}
							title="URL preview"
							allowFullScreen
						/>
					</div>
				)}
				{!isValid && (
					<div className="preview-wrapper">
						<NonIdealState title="Enter an HTTPS URL above" icon="application" />
					</div>
				)}
			</div>
		);
	}
}
export default MediaIframe;
