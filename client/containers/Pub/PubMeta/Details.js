import React from 'react';
import PropTypes from 'prop-types';
import { PageContext } from 'components/PageWrapper/PageWrapper';
import { pubDataProps } from 'types/pub';

require('./details.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
};

const Details = (props) => {
	const { pubData } = props;

	return <div className="pub-meta-details">Details!</div>;
};

Details.propTypes = propTypes;
export default Details;
