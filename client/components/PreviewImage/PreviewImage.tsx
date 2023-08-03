import React, { useState } from 'react';
import classNames from 'classnames';
import uuid from 'uuid';

import { getResizedUrl } from 'utils/images';
import { generatePubBackground } from 'utils/pubs';

type Props = {
	className?: string;
	fitIn?: number;
	src?: string;
	id?: null | string;
};

const PreviewImage = (props: Props) => {
	const { className = '', fitIn = 800, src = null, id } = props;
	const [randomUuid] = useState(() => uuid.v4());
	const resizedImage = getResizedUrl(src, 'inside', fitIn);
	const randomOrProvidedUuid = id || randomUuid;
	const style = src
		? { backgroundImage: `url("${resizedImage}")` }
		: { background: generatePubBackground(randomOrProvidedUuid) };
	return <div className={classNames('preview-image-component', className)} style={style} />;
};

export default PreviewImage;
