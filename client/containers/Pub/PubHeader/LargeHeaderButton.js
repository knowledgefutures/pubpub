import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'reakit';

require('./largeHeaderButton.scss');

const propTypes = {};

const LargeHeaderButton = (props) => {
	const { icon } = props;
	return <Button className="large-header-button-component">Blah blah blah</Button>;
};

LargeHeaderButton.propTypes = propTypes;
export default LargeHeaderButton;
