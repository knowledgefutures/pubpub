import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { InputGroup, Button, Intent, NonIdealState } from '@blueprintjs/core';
import { isHttpsUri } from 'valid-url';

import Icon from 'components/Icon/Icon';
import { apiFetch } from 'client/utils/apiFetch';
import { getIframeSrc, getEmbedType } from 'client/utils/editor';

const propTypes = {
	onInsert: PropTypes.func.isRequired,
	// isSmall: PropTypes.bool.isRequired,
};

class MediaGithub extends Component {
	constructor(props) {
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
		const isValid = isHttpsUri(input) && getEmbedType(input) === 'github';
		this.setState(
			{
				input: input,
				isValid: isValid,
			},
			() => {
				if (!this.state.isValid) {
					return this.setState({ embedUrl: '', embedTitle: '' });
				}

				const queryParams = `?type=${getEmbedType(input)}&input=${input}`;
				return apiFetch(`/api/editor/embed${queryParams}`).then((result) => {
					this.setState({
						embedUrl: `data:text/html;charset=utf-8,${result.html}`,
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
			height: 800,
		});
	}

	render() {
		return (
			<div className="formatting-bar_media-component-content">
				<InputGroup
					className="top-input"
					fill={true}
					placeholder="Enter GitHub Gist URL"
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
						<iframe frameBorder="none" src={this.state.embedUrl} title="URL preview" />
					</div>
				)}
				{!this.state.isValid && (
					<div className="preview-wrapper">
						<NonIdealState
							title="Paste a GitHub Gist URL above"
							icon={<Icon icon="github" iconSize={60} useColor={true} />}
							action={
								<Button
									text="Load Sample URL"
									onClick={() => {
										this.handleInput(
											'https://gist.github.com/gabestein/16fd6244f88625c0ea02e044a22d4ac5',
										);
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

MediaGithub.propTypes = propTypes;
export default MediaGithub;
