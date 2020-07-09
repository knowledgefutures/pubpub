import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button } from 'reakit/Button';

import PubPreviewImage from 'components/PubPreview/PubPreviewImage';
import { generateAuthorString } from 'client/components/PubPreview/pubPreviewUtils';

require('./pubMenuItem.scss');

const propTypes = {
	active: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
	showImage: PropTypes.bool.isRequired,
	pubData: PropTypes.shape({
		id: PropTypes.string,
		title: PropTypes.string,
	}).isRequired,
};

const PubMenuItem = React.forwardRef((props, ref) => {
	const { active, pubData, onClick, showImage } = props;
	const authorString = generateAuthorString(pubData);
	return (
		<Button
			as="a"
			ref={ref}
			className={classNames('bp3-menu-item', 'pub-menu-item-component', active && 'active')}
			onClick={onClick}
		>
			{showImage && <PubPreviewImage pubData={pubData} />}
			<div className="inner">
				<div className="title">{pubData.title}</div>
				<div className="subtitle">{authorString}</div>
			</div>
		</Button>
	);
});

PubMenuItem.propTypes = propTypes;
export default PubMenuItem;
