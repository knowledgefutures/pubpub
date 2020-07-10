import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { getResizedUrl } from 'utils/images';
import { generatePubBackground } from 'utils/pubs';

const propTypes = {
	className: PropTypes.string,
	fitIn: PropTypes.number,
	src: PropTypes.string,
	title: PropTypes.string.isRequired,
};

const defaultProps = {
	className: '',
	fitIn: 800,
	src: null,
};

const PreviewImage = (props) => {
	const { className, fitIn, src, title } = props;
	const resizedImage = getResizedUrl(src, 'fit-in', `${fitIn}x0`);
	const style = src
		? { backgroundImage: `url("${resizedImage}")` }
		: { background: generatePubBackground(title) };
	return <div className={classNames('preview-image-component', className)} style={style} />;
};

PreviewImage.propTypes = propTypes;
PreviewImage.defaultProps = defaultProps;
export default PreviewImage;
