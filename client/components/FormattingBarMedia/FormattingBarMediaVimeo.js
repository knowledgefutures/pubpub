import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { InputGroup, Button, Intent, NonIdealState } from '@blueprintjs/core';
import { isHttpsUri } from 'valid-url';
import { apiFetch, getIframeSrc, getEmbedType } from 'utilities';
import Icon from 'components/Icon/Icon';

const propTypes = {
	onInsert: PropTypes.func.isRequired,
	// isSmall: PropTypes.bool.isRequired,
};

class FormattingBarMediaVimeo extends Component {
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
		const isValid = isHttpsUri(input) && getEmbedType(input) === 'vimeo';
		this.setState({
			input: input,
			isValid: isValid,
		}, ()=> {
			if (!this.state.isValid) {
				return this.setState({ embedUrl: '', embedTitle: '' });
			}

			const queryParams = `?type=${getEmbedType(input)}&input=${input}`;
			return apiFetch(`/api/editor/embed${queryParams}`)
			.then((result)=> {
				this.setState({
					embedUrl: getIframeSrc(result.html),
					embedTitle: result.title,
				});
			});
		});
	}

	handleInsert() {
		this.props.onInsert('iframe', {
			url: this.state.embedUrl,
			caption: this.state.embedTitle,
			align: 'full',
		});
	}

	render () {
		return (
			<div className="formatting-bar-media-component-content">
				<InputGroup
					className="top-input"
					fill={true}
					placeholder="Enter Vimeo URL"
					large={true}
					value={this.state.input}
					onChange={(evt)=> {
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
				{this.state.isValid &&
					<div className="preview-wrapper">
						<iframe
							frameBorder="none"
							src={this.state.embedUrl}
							title="URL preview"
						/>
					</div>
				}
				{!this.state.isValid &&
					<div className="preview-wrapper">
						<NonIdealState
							title="Paste a Vimeo URL above"
							icon={<Icon icon="vimeo" iconSize={60} useColor={true} />}
							action={(
								<Button
									text="Load Sample URL"
									onClick={()=> {
										this.handleInput('https://vimeo.com/146022717');
									}}
								/>
							)}
						/>
					</div>
				}
			</div>
		);
	}
}

FormattingBarMediaVimeo.propTypes = propTypes;
export default FormattingBarMediaVimeo;
