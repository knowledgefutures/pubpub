import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit/Button';

import { Byline, PreviewImage } from 'components';

require('./pubMenuItem.scss');

type BylineProps = React.ComponentProps<typeof Byline>;
interface Props {
	active?: boolean;
	disabled?: boolean;
	contributors?: any[];
	image?: string;
	isSkeleton?: boolean;
	onClick: null | (() => any);
	showImage?: boolean;
	title: string;
	bylineProps?: Partial<BylineProps>;
}

const PubMenuItem = React.forwardRef((props: Props, ref: any) => {
	const {
		active = false,
		contributors,
		disabled = false,
		image = '',
		isSkeleton = false,
		onClick,
		showImage = false,
		title,
		bylineProps = {},
	} = props;
	const skeletonClass = classNames(isSkeleton && 'bp3-skeleton');

	const className = classNames(
		'bp3-menu-item',
		'pub-menu-item-component',
		active && 'active',
		disabled && 'bp3-disabled',
		isSkeleton && 'is-skeleton',
		!onClick && 'unselectable',
	);

	const children = (
		<>
			{showImage && <PreviewImage src={image} title={title} className={skeletonClass} />}
			<div className="inner">
				<div className={classNames('title', skeletonClass)}>{title}</div>
				{contributors && (
					<div className={classNames('subtitle', skeletonClass)}>
						<Byline contributors={contributors} linkToUsers={false} {...bylineProps} />
					</div>
				)}
			</div>
		</>
	);

	const sharedProps = { ref, className, children };

	if (onClick) {
		return <Button as="button" {...sharedProps} onClick={onClick} />;
	}

	return <div {...sharedProps} />;
});

export default PubMenuItem;
