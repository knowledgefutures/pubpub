import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit/Button';

import { Byline, PreviewImage } from 'components';

require('./pubMenuItem.scss');

interface Props {
	active?: boolean;
	disabled?: boolean;
	contributors: any[];
	image?: string;
	isSkeleton?: boolean;
	onClick: () => any;
	showImage?: boolean;
	title: string;
}

const PubMenuItem = React.forwardRef((props: Props, ref: React.Ref<HTMLAnchorElement>) => {
	const {
		active = false,
		contributors,
		disabled = false,
		image = '',
		isSkeleton = false,
		onClick,
		showImage = false,
		title,
	} = props;
	const skeletonClass = classNames(isSkeleton && 'bp3-skeleton');
	return (
		<Button
			as="a"
			ref={ref}
			className={classNames(
				'bp3-menu-item',
				'pub-menu-item-component',
				active && 'active',
				disabled && 'bp3-disabled',
				isSkeleton && 'is-skeleton',
			)}
			onClick={onClick}
		>
			{showImage && <PreviewImage src={image} title={title} className={skeletonClass} />}
			<div className="inner">
				<div className={classNames('title', skeletonClass)}>{title}</div>
				<div className={classNames('subtitle', skeletonClass)}>
					<Byline contributors={contributors} linkToUsers={false} />
				</div>
			</div>
		</Button>
	);
});

export default PubMenuItem;
