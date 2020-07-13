import React from 'react';
import PropTypes from 'prop-types';
import { usePageContext } from 'utils/hooks';
import {
	Callout,
	Button,
	Intent,
	Tooltip,
	Position,
	PopoverInteractionKind,
} from '@blueprintjs/core';
import IframeResizer from 'iframe-resizer-react';

import { DashboardFrame } from 'components';

require('./dashboardImpact.scss');

const propTypes = {
	impactData: PropTypes.object.isRequired,
};

const DashboardImpact = (props) => {
	const { impactData } = props;
	const { baseToken, benchmarkToken } = impactData;
	const { scopeData } = usePageContext();
	const {
		elements: { activeTargetType, activeTargetName, activeTarget },
		activePermissions: { canView },
	} = scopeData;
	const displayDataWarning = activeTarget.createdAt < '2020-04-29';
	const isCollection = activeTargetType === 'collection';
	const genUrl = (token) => {
		return `https://metabase.pubpub.org/embed/dashboard/${token}#bordered=false&titled=false`;
	};
	const getOffset = (width) => {
		return width < 960 ? 45 : 61;
	};
	return (
		<DashboardFrame
			title="Impact"
			className="dashboard-impact-container"
			details={`Learn more about who your ${activeTargetName} is reaching.`}
		>
			<section>
				<h3 id="historical_benchmark" className="absolute-header">
					Analytics
					{canView && !isCollection && displayDataWarning && (
						<Tooltip
							content={
								<div className="impact-warning-tooltip">
									Analytics data collected before April 30, 2020 used a different
									analytics system than data collected after April 30, 2020. As a
									result, the Users metric will be inconsistent between these two
									periods, and should not be used for direct comparisons. For more
									information, see our{' '}
									<a
										href="https://discourse.knowledgefutures.org/t/user-metric-discrepancies-between-july-12-2019-and-april-30-2020/259"
										target="_blank"
										rel="noopener noreferrer"
									>
										explanatory Discourse post
									</a>{' '}
									and the{' '}
									<a href="#historical_benchmark">
										Historical Benchmark Dashboard
									</a>
									, below.
								</div>
							}
							hoverCloseDelay={300}
							intent={Intent.WARNING}
							position={Position.BOTTOM_LEFT}
							interactionKind={PopoverInteractionKind.HOVER}
						>
							<Button
								className="warning-button"
								intent={Intent.WARNING}
								icon="warning-sign"
								minimal
							/>
						</Tooltip>
					)}
				</h3>
				{canView && isCollection && (
					<Callout>Collection-level impact data coming soon.</Callout>
				)}
				{canView ? (
					<IframeResizer
						className="metabase main"
						src={genUrl(baseToken)}
						title="Analytics"
						frameBorder="0"
						onResized={({ iframe, height, width }) => {
							/* eslint-disable-next-line no-param-reassign */
							iframe.style.height = `${height - getOffset(width)}px`;
						}}
					/>
				) : (
					<p>Login or ask the community administrator for access to impact data.</p>
				)}
			</section>
			<section>
				{canView && displayDataWarning && (
					<React.Fragment>
						<h3 id="historical_benchmark" className="absolute-header">
							Historical User Benchmark
							<Tooltip
								content={
									<div className="impact-warning-tooltip">
										This dashboard shows the historical user metric (prior to
										April 30, 2020) graphed against the new user metric during
										an overlap period, for making comparisons between the two.
										For more information, see our{' '}
										<a
											href="https://discourse.knowledgefutures.org/t/user-metric-discrepancies-between-july-12-2019-and-april-30-2020/259"
											target="_blank"
											rel="noopener noreferrer"
										>
											explanatory Discourse post
										</a>
									</div>
								}
								hoverCloseDelay={300}
								intent={Intent.WARNING}
								position={Position.BOTTOM_LEFT}
								interactionKind={PopoverInteractionKind.HOVER}
							>
								<Button
									className="warning-button"
									intent={Intent.WARNING}
									icon="warning-sign"
									minimal
								/>
							</Tooltip>
						</h3>
						<IframeResizer
							className="metabase benchmark"
							src={genUrl(benchmarkToken)}
							title="Benchmark"
							frameBorder="0"
							onResized={({ iframe, height, width }) => {
								/* eslint-disable-next-line no-param-reassign */
								iframe.style.height = `${height - getOffset(width)}px`;
							}}
						/>
					</React.Fragment>
				)}
			</section>
		</DashboardFrame>
	);
};

DashboardImpact.propTypes = propTypes;
export default DashboardImpact;
