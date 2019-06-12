/**
 * A component that renders a card for an indivudal pub that can be dragged between DragDropListing
 * instances within the CollectionEditor
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { pubDataProps } from 'types/pub';
import Icon from 'components/Icon/Icon';
import { AnchorButton } from '@blueprintjs/core';

import { authorsNamesFromPub } from './utils';

const propTypes = {
	controls: PropTypes.node,
	isDragging: PropTypes.bool,
	dragHandleProps: PropTypes.shape({}),
	pub: pubDataProps.isRequired,
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
					<div>
						{dragHandleProps ? (
							<a href={`/pub/${pub.slug}`}>{pub.title}</a>
						) : (
							<span className="left-title">
								{pub.title}
								<AnchorButton
									href={`/pub/${pub.slug}`}
									target="_blank"
									rel="noopener noreferrer"
									minimal={true}
									small={true}
									className="out-link"
									icon={
										<Icon
											icon="share"
											alt="open in new tab icon"
											iconSize={11}
										/>
									}
								/>
							</span>
						)}
					</div>
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
