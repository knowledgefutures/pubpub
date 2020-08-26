import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit/Button';

import { Byline, PreviewImage } from 'components';

require('./pubMenuItem.scss');

const propTypes = {
	active: PropTypes.bool,
	disabled: PropTypes.bool,
	contributors: PropTypes.array.isRequired,
	image: PropTypes.string,
	isSkeleton: PropTypes.bool,
	onClick: PropTypes.func.isRequired,
	showImage: PropTypes.bool,
	title: PropTypes.string.isRequired,
};

const defaultProps = {
	active: false,
	disabled: false,
	image: null,
	isSkeleton: false,
	showImage: false,
};

const PubMenuItem = React.forwardRef((props, ref) => {
	// @ts-expect-error ts-migrate(2339) FIXME: Property 'active' does not exist on type '{ childr... Remove this comment to see the full error message
	const { active, contributors, disabled, image, isSkeleton, onClick, showImage, title } = props;
	const skeletonClass = classNames(isSkeleton && 'bp3-skeleton');
	return (
		<Button
			as="a"
			// @ts-expect-error ts-migrate(2769) FIXME: Type 'unknown' is not assignable to type 'HTMLAnch... Remove this comment to see the full error message
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
			{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'. */}
			{showImage && <PreviewImage src={image} title={title} className={skeletonClass} />}
			<div className="inner">
				<div className={classNames('title', skeletonClass)}>{title}</div>
				<div className={classNames('subtitle', skeletonClass)}>
					{/* @ts-expect-error ts-migrate(2322) FIXME: Type 'any' is not assignable to type 'never'. */}
					<Byline contributors={contributors} linkToUsers={false} />
				</div>
			</div>
		</Button>
	);
});

// @ts-expect-error ts-migrate(2559) FIXME: Type '{ active: Requireable<boolean>; disabled: Re... Remove this comment to see the full error message
PubMenuItem.propTypes = propTypes;
// @ts-expect-error ts-migrate(2559) FIXME: Type '{ active: boolean; disabled: boolean; image:... Remove this comment to see the full error message
PubMenuItem.defaultProps = defaultProps;
export default PubMenuItem;
