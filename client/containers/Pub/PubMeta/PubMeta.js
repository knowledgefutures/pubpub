import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Icon } from '@blueprintjs/core';
import stickybits from 'stickybits';

import GridWrapper from 'components/GridWrapper/GridWrapper';
import { pubDataProps } from 'types/pub';
import Details from './Details';
import Download from './Download';
import History from './History';
import Social from './Social';

require('./pubMeta.scss');

const propTypes = {
	pubData: pubDataProps.isRequired,
	updateLocalData: PropTypes.func.isRequired,
};

const shouldShowHeader = (metaMode) => metaMode !== 'history';

const shouldUseSticky = (metaMode) => metaMode === 'history';

const metaHeaderText = (metaMode) => {
	if (metaMode === 'details') {
		return 'Pub details';
	}
	if (metaMode === 'social') {
		return 'Share this Pub';
	}
	return metaMode.charAt(0).toUpperCase() + metaMode.slice(1);
};

const PubMeta = (props) => {
	const { pubData, collabData, historyData, updateLocalData } = props;
	const { metaMode } = pubData;

	const stickyRef = useRef();

	useEffect(() => {
		const cleanup = () => {
			if (stickyRef.current) {
				try {
					stickyRef.current.cleanup();
				} catch (_) {
					// This sometimes fails if the element's parent has been unmounted. That's okay.
				}
			}
		};
		if (shouldUseSticky(metaMode)) {
			stickyRef.current = stickybits('.pub-meta-component', {
				stickyBitStickyOffset: 35,
				useStickyClasses: true,
			});
		} else if (stickyRef.current) {
			cleanup();
		}
		return cleanup;
	}, [metaMode]);

	if (!pubData.metaMode) {
		return null;
	}

	return (
		<div className="pub-meta-component">
			<GridWrapper containerClassName="pub">
				{shouldShowHeader(metaMode) && (
					<div className="header">
						<h3>{metaHeaderText(metaMode)}</h3>
						<Button
							icon={<Icon icon="small-cross" iconSize={18} />}
							minimal={true}
							className="meta-close"
							onClick={() => {
								updateLocalData('pub', {
									metaMode: undefined,
								});
							}}
						/>
					</div>
				)}
				{metaMode === 'details' && <Details pubData={pubData} />}
				{metaMode === 'social' && <Social pubData={pubData} />}
				{metaMode === 'download' && (
					<Download pubData={pubData} updateLocalData={updateLocalData} />
				)}
				{metaMode === 'history' && (
					<History
						pubData={pubData}
						collabData={collabData}
						updateLocalData={updateLocalData}
						historyData={historyData}
					/>
				)}
			</GridWrapper>
		</div>
	);
};

PubMeta.propTypes = propTypes;
export default PubMeta;
