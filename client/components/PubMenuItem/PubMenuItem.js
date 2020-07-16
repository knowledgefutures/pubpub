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
	const { active, contributors, disabled, image, isSkeleton, onClick, showImage, title } = props;
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

PubMenuItem.propTypes = propTypes;
PubMenuItem.defaultProps = defaultProps;
export default PubMenuItem;
