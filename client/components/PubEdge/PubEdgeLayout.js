import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

require('./pubEdge.scss');

const propTypes = {
	bylineElement: PropTypes.node.isRequired,
	className: PropTypes.string,
	detailsElement: PropTypes.node.isRequired,
	metadataElements: PropTypes.arrayOf(PropTypes.node).isRequired,
	outerElementProps: PropTypes.object,
	titleElement: PropTypes.node.isRequired,
	topLeftElement: PropTypes.node,
};

const defaultProps = {
	className: null,
	outerElementProps: {},
	topLeftElement: null,
};

const PubEdgeLayout = (props) => {
	const {
		bylineElement,
		className,
		detailsElement,
		metadataElements,
		outerElementProps,
		titleElement,
		topLeftElement,
	} = props;
	return (
		<article className={classNames('pub-edge-layout', className)} {...outerElementProps}>
			<div className="top">
				{topLeftElement && <div className="top-left">{topLeftElement}</div>}
				<div className="top-right">
					<div className="title-container">{titleElement}</div>
					<div className="byline-container">{bylineElement}</div>
					<ul className="metadata">
						{metadataElements
							.map(
								(element, index) =>
									element && (
										// eslint-disable-next-line react/no-array-index-key
										<li key={index}>{element}</li>
									),
							)
							.filter((x) => x)}
					</ul>
				</div>
			</div>
			{detailsElement}
		</article>
	);
};

PubEdgeLayout.propTypes = propTypes;
PubEdgeLayout.defaultProps = defaultProps;
export default PubEdgeLayout;
