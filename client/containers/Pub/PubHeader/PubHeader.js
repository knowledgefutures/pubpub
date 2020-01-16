import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from '../pubHooks';

require('./pubHeader.scss');

const propTypes = {
	collabData: PropTypes.object.isRequired,
	historyData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const PubHeader = (props) => {
	const headerRef = useRef(null);
	const { pubData, collabData, updateLocalData, historyData } = props;
	const { communityData, locationData } = usePageContext();
	return <div className="pub-header-component" ref={headerRef} />;
};

PubHeader.propTypes = propTypes;
export default PubHeader;
