import React from 'react';
import PropTypes from 'prop-types';
// import { usePageContext } from 'utils/hooks';

require('./thread.scss');

const propTypes = {
	threadData: PropTypes.object.isRequired,
};

const Thread = (props) => {
	return <div className="thread-component">Thread</div>;
};

Thread.propTypes = propTypes;
export default Thread;
