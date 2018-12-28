import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Menu, MenuItem } from '@blueprintjs/core';

const propTypes = {
	
};

const defaultProps = {
	
};

class FormattingBarMediaImage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			
		};
	}

	render () {
		
		return (
			<div className="formatting-bar-media-component-content">
				This is the image block!
			</div>
		);
	}
}

FormattingBarMediaImage.propTypes = propTypes;
FormattingBarMediaImage.defaultProps = defaultProps;
export default FormattingBarMediaImage;
