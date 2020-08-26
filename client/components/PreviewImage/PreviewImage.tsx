import React from 'react';
import classNames from 'classnames';

import { getResizedUrl } from 'utils/images';
import { generatePubBackground } from 'utils/pubs';

type OwnProps = {
	className?: string;
	fitIn?: number;
	src?: string;
	title: string;
};

const defaultProps = {
	className: '',
	fitIn: 800,
	src: null,
};

type Props = OwnProps & typeof defaultProps;

const PreviewImage = (props: Props) => {
	const { className, fitIn, src, title } = props;
	const resizedImage = getResizedUrl(src, 'fit-in', `${fitIn}x0`);
	const style = src
		? { backgroundImage: `url("${resizedImage}")` }
		: { background: generatePubBackground(title) };
	return <div className={classNames('preview-image-component', className)} style={style} />;
};
PreviewImage.defaultProps = defaultProps;
export default PreviewImage;
