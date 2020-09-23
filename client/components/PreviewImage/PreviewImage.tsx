import React from 'react';
import classNames from 'classnames';

import { getResizedUrl } from 'utils/images';
import { generatePubBackground } from 'utils/pubs';

type Props = {
	className?: string;
	fitIn?: number;
	src?: string;
	title: string;
};

const PreviewImage = (props: Props) => {
	const { className = '', fitIn = 800, src = null, title } = props;
	const resizedImage = getResizedUrl(src, 'fit-in', `${fitIn}x0`);
	const style = src
		? { backgroundImage: `url("${resizedImage}")` }
		: { background: generatePubBackground(title) };
	return <div className={classNames('preview-image-component', className)} style={style} />;
};

export default PreviewImage;
