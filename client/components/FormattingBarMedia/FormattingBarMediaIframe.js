import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { InputGroup, Button, Intent, NonIdealState } from '@blueprintjs/core';
import { isHttpsUri } from 'valid-url';

const propTypes = {
	onInsert: PropTypes.func.isRequired,
	isSmall: PropTypes.bool.isRequired,
};

class FormattingBarMediaIframe extends Component {
	constructor(props) {
		super(props);
		this.state = {
			url: '',
		};
		this.handleInsert = this.handleInsert.bind(this);
	}

	handleInsert() {
		this.props.onInsert('iframe', { url: this.state.url });
	}

	render () {
		const isValid = isHttpsUri(this.state.url);
		return (
			<div className="formatting-bar-media-component-content">
				<InputGroup
					className="top-input"
					fill={true}
					placeholder="Enter URL"
					value={this.state.url}
					large={true}
					onChange={(evt)=> {
						const val = evt.target.value;
						const re = /(?<=src=").*?(?=[?"])/;
						const getSrc = val.indexOf('<iframe') > -1 && val.match(re) && val.match(re)[0];
						this.setState({ url: getSrc || val });
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
				{isValid &&
					<iframe
						frameBorder="none"
						src={this.state.url}
						title="URL preview"
					/>
				}
				{!isValid && this.state.url &&
					<div className="splash-panel">
						<NonIdealState
							title="Must be an HTTPS URL"
							icon="globe-network"
						/>
					</div>
				}
			</div>
		);
	}
}

FormattingBarMediaIframe.propTypes = propTypes;
export default FormattingBarMediaIframe;
