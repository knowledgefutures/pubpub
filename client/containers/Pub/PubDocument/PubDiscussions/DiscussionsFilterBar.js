import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@blueprintjs/core';

const propTypes = {
	pubData: PropTypes.object.isRequired,
	threadData: PropTypes.array.isRequired,
	children: PropTypes.func.isRequired,
};

const DiscussionsFilterBar = (props) => {
	const { threadData, children } = props;
	return <div className="discussion-filter-bar-component">{children(threadData)}</div>;
};

DiscussionsFilterBar.propTypes = propTypes;
export default DiscussionsFilterBar;
