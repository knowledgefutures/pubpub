import React from 'react';
import PropTypes from 'prop-types';

import { TabToShow } from 'components';

require('./skipLink.scss');

const propTypes = {
	children: PropTypes.node.isRequired,
	targetId: PropTypes.string.isRequired,
};

const SkipLink = ({ targetId, children }) => {
	return <TabToShow className="skip-link-component" href={`#${targetId}`} children={children} />;
};

SkipLink.propTypes = propTypes;
export default SkipLink;
