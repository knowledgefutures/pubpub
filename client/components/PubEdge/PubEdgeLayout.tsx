import React from 'react';
import classNames from 'classnames';

require('./pubEdge.scss');

type OwnProps = {
	bylineElement: React.ReactNode;
	className?: string;
	detailsElement: React.ReactNode;
	metadataElements: React.ReactNode[];
	outerElementProps?: any;
	titleElement: React.ReactNode;
	topLeftElement?: React.ReactNode;
};

const defaultProps = {
	className: null,
	outerElementProps: {},
	topLeftElement: null,
};

type Props = OwnProps & typeof defaultProps;

const PubEdgeLayout = (props: Props) => {
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
					{bylineElement && <div className="byline-container">{bylineElement}</div>}
					<ul className="metadata">
						{metadataElements
							// @ts-expect-error ts-migrate(2339) FIXME: Property 'map' does not exist on type 'never'.
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
PubEdgeLayout.defaultProps = defaultProps;
export default PubEdgeLayout;
