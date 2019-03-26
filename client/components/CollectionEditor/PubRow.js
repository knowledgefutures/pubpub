/**
 * A component that renders a card for an indivudal pub that can be dragged between DragDropListing
 * instances within the CollectionEditor
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import pubType from 'types/pub';
import Icon from 'components/Icon/Icon';

import { authorsNamesFromPub } from './utils';

const propTypes = {
	controls: PropTypes.node,
	isDragging: PropTypes.bool,
	dragHandleProps: PropTypes.shape({}),
	pub: pubType.isRequired,
};

const defaultProps = {
	dragHandleProps: null,
	isDragging: false,
	controls: null,
};

const PubRow = (props) => {
	const { pub, isDragging, dragHandleProps, controls } = props;
	return (
		<div className={classNames('pub-row', isDragging && 'is-dragging')}>
			{dragHandleProps && (
				<div {...dragHandleProps} className="drag-handle">
					<Icon icon="drag-handle-vertical" />
				</div>
			)}
			<div className="contents">
				<div className="info">
					<div>{pub.title}</div>
					<div className="bp3-text-muted">
						<em>{authorsNamesFromPub(pub).join(', ')}</em>
					</div>
				</div>
				<div className="controls">{controls}</div>
			</div>
		</div>
	);
};

PubRow.propTypes = propTypes;
PubRow.defaultProps = defaultProps;

export default PubRow;
