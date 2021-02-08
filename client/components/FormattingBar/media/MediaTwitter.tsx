import React, { Component } from 'react';
import { InputGroup, Button, Intent, NonIdealState } from '@blueprintjs/core';
import { isHttpsUri } from 'valid-url';

import Icon from 'components/Icon/Icon';
import { apiFetch } from 'client/utils/apiFetch';
import { getEmbedType } from 'client/utils/editor';

type TwitterEmbedData = {
	url: string;
	caption: string;
	align: string;
};

type Props = {
	onInsert: (nodeType: string, embedData: TwitterEmbedData) => unknown;
};

const sampleUrl =
	process.env.NODE_ENV === 'production'
		? 'https://twitter.com/pubpub'
		: 'https://twitter.com/kfutures';

type State = {
	isValid: boolean;
	input: string;
	embedUrl: string;
	embedTitle: string;
};

class MediaTwitter extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			isValid: false,
			input: '',
			embedUrl: '',
			embedTitle: '',
		};
		this.handleInput = this.handleInput.bind(this);
		this.handleInsert = this.handleInsert.bind(this);
	}

	handleInput(url) {
		const input = url;
		const isValid = isHttpsUri(input) && getEmbedType(input) === 'twitter';
		this.setState({ input, isValid });
		if (!isValid) {
			this.setState({ embedUrl: '', embedTitle: '' });
			return;
		}

		const queryParams = `?type=${getEmbedType(input)}&input=${input}`;
		// @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
		apiFetch(`/api/editor/embed${queryParams}`).then((result) => {
			this.setState({
				embedUrl: result.html,
				embedTitle: result.title,
			});
		});
	}

	handleInsert() {
		this.props.onInsert('iframe', {
			url: `data:text/html;charset=utf-8,${encodeURIComponent(this.state.embedUrl)}`,
			caption: this.state.embedTitle,
			align: 'full',
		});
	}

	render() {
		return (
			<div className="formatting-bar_media-component-content">
				<InputGroup
					className="top-input"
					fill
					placeholder="Enter Twitter URL"
					large
					value={this.state.input}
					onChange={(evt) => {
						this.handleInput(evt.target.value);
					}}
					rightElement={
						<Button
							text="Insert"
							intent={Intent.PRIMARY}
							disabled={!this.state.embedUrl}
							large
							onClick={this.handleInsert}
						/>
					}
				/>
				{this.state.isValid && (
					<div className="preview-wrapper">
						<iframe
							frameBorder="none"
							src={`data:text/html;charset=utf-8,${encodeURIComponent(
								this.state.embedUrl,
							)}`}
							title="URL preview"
						/>
					</div>
				)}
				{!this.state.isValid && (
					<div className="preview-wrapper">
						<NonIdealState
							title="Paste a Twitter URL above. You can embed a tweet, profile, list, collection, or likes timeline."
							icon={<Icon icon="twitter" iconSize={60} useColor={true} />}
							action={
								<Button
									text="Load Sample URL"
									onClick={() => {
										this.handleInput(sampleUrl);
									}}
								/>
							}
						/>
					</div>
				)}
			</div>
		);
	}
}
export default MediaTwitter;
