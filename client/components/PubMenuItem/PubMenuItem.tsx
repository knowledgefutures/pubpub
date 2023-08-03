import React from 'react';
import classNames from 'classnames';
import { Button } from 'reakit/Button';
import { Classes } from '@blueprintjs/core';

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
	title: React.ReactNode;
	bylineProps?: Partial<BylineProps>;
	id: null | string;
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
		id,
		bylineProps = {},
	} = props;
	const skeletonClass = classNames(isSkeleton && Classes.SKELETON);

	const className = classNames(
		Classes.MENU_ITEM,
		'pub-menu-item-component',
		active && 'active',
		disabled && Classes.DISABLED,
		isSkeleton && 'is-skeleton',
		!onClick && 'unselectable',
	);

	const children = (
		<>
			{showImage && <PreviewImage src={image} id={id} className={skeletonClass} />}
			<div className="inner">
				<div className={classNames('title', skeletonClass)}>{title}</div>
				{contributors && (
					<div className={classNames('subtitle', skeletonClass)}>
						<Byline
							contributors={contributors}
							linkToUsers={false}
							truncateAt={4}
							{...bylineProps}
						/>
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
