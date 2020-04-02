import React from 'react';
import PropTypes from 'prop-types';
// import { usePageContext } from 'utils/hooks';

require('./threadInput.scss');

const propTypes = {
	threadData: PropTypes.object.isRequired,
};

const ThreadInput = (props) => {
	return <div className="thread-input-component">ThreadInput</div>;
};

ThreadInput.propTypes = propTypes;
export default ThreadInput;
