import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getResizedUrl, generatePubBackground } from 'utils';
import { pubDataProps } from 'types/pub';

const propTypes = {
	className: PropTypes.string,
	fitIn: PropTypes.number,
	pubData: pubDataProps.isRequired,
};

const defaultProps = {
	fitIn: 800,
	className: '',
};

const PubPreviewImage = (props) => {
	const { className, fitIn, pubData } = props;
	const resizedImage = getResizedUrl(pubData.avatar, 'fit-in', `${fitIn}x0`);
	const style =
		pubData.avatar || !pubData.slug
			? { backgroundImage: `url("${resizedImage}")` }
			: { background: generatePubBackground(pubData.title) };
	return <div className={classNames('pub-preview-image', className)} style={style} />;
};

PubPreviewImage.propTypes = propTypes;
PubPreviewImage.defaultProps = defaultProps;
export default PubPreviewImage;
