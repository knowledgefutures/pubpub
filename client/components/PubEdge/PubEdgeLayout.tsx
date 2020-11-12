import React from 'react';
import classNames from 'classnames';

require('./pubEdge.scss');

export type PubEdgeLayoutProps = {
	bylineElement: React.ReactNode;
	className?: string;
	detailsElement: React.ReactNode;
	metadataElements: React.ReactNode[];
	outerElementProps?: any;
	titleElement: React.ReactNode;
	topLeftElement?: React.ReactNode;
};

const PubEdgeLayout = (props: PubEdgeLayoutProps) => {
	const {
		bylineElement,
		className = null,
		detailsElement,
		metadataElements,
		outerElementProps = {},
		titleElement,
		topLeftElement = null,
	} = props;
	return (
		<article className={classNames('pub-edge-layout', className)} {...outerElementProps}>
			<div className="top">
				{topLeftElement && <div className="top-left">{topLeftElement}</div>}
				<div className="top-right">
					<div className="title-container">{titleElement}</div>
					{bylineElement && <div className="byline-container">{bylineElement}</div>}
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

export default PubEdgeLayout;
