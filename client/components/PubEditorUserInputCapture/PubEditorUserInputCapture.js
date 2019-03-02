import PropTypes from 'prop-types';
import React from 'react';

import { Plugin } from 'prosemirror-state';

const createCaptureInputPlugin = (onCapture) => () =>
	new Plugin({
		props: {
			handleDOMEvents: {
				mouseup: onCapture,
				keydown: onCapture,
			},
		},
	});

const propTypes = {
	children: PropTypes.func.isRequired,
};

export default class PubEditorUserInputCapture extends React.Component {
	constructor(props) {
		super(props);
		this.captureInputPlugin = createCaptureInputPlugin(this.updateCapture.bind(this));
		this.state = {
			lastInputCapture: Date.now(),
		};
	}

	updateCapture() {
		setTimeout(() => this.setState({ lastInputCapture: Date.now() }));
	}

	render() {
		return this.props.children({
			captureInputPlugin: this.captureInputPlugin,
			lastInputCapture: this.state.lastInputCapture,
		});
	}
}

PubEditorUserInputCapture.propTypes = propTypes;
