import React, { Component } from 'react';
import { InputGroup, Button, Intent, NonIdealState } from '@blueprintjs/core';
import { isHttpsUri } from 'valid-url';

import Icon from 'components/Icon/Icon';
import { apiFetch } from 'client/utils/apiFetch';
import { getIframeSrc, getEmbedType } from 'client/utils/editor';

type Props = {
	onInsert: (...args: any[]) => any;
};

type State = any;

class MediaVimeo extends Component<Props, State> {
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
		const input = getIframeSrc(url) || url;
		const isValid = isHttpsUri(input) && getEmbedType(input) === 'vimeo';
		this.setState(
			{
				input,
				isValid,
			},
			() => {
				if (!this.state.isValid) {
					return this.setState({ embedUrl: '', embedTitle: '' });
				}

				const queryParams = `?type=${getEmbedType(input)}&input=${input}`;
				return apiFetch(`/api/editor/embed${queryParams}`).then((result) => {
					this.setState({
						embedUrl: getIframeSrc(result.html),
						embedTitle: result.title,
					});
				});
			},
		);
	}

	handleInsert() {
		this.props.onInsert('iframe', {
			url: this.state.embedUrl,
			caption: this.state.embedTitle,
			align: 'full',
		});
	}

	render() {
		return (
			<div className="formatting-bar_media-component-content">
				<InputGroup
					className="top-input"
					fill={true}
					placeholder="Enter Vimeo URL"
					large={true}
					value={this.state.input}
					onChange={(evt) => {
						this.handleInput(evt.target.value);
					}}
					rightElement={
						<Button
							text="Insert"
							intent={Intent.PRIMARY}
							disabled={!this.state.embedUrl}
							large={true}
							onClick={this.handleInsert}
						/>
					}
				/>
				{this.state.isValid && (
					<div className="preview-wrapper">
						<iframe
							frameBorder="none"
							src={this.state.embedUrl}
							title="URL preview"
							allowFullScreen
						/>
					</div>
				)}
				{!this.state.isValid && (
					<div className="preview-wrapper">
						<NonIdealState
							title="Paste a Vimeo URL above"
							icon={<Icon icon="vimeo" iconSize={60} useColor={true} />}
							action={
								<Button
									text="Load Sample URL"
									onClick={() => {
										this.handleInput('https://vimeo.com/146022717');
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
export default MediaVimeo;
