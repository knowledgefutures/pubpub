import React, { useMemo } from 'react';
import { Button, Icon, Tag, Tooltip } from '@blueprintjs/core';

import { LandingPageCommunityFeature } from 'types';
import { DialogLauncher } from 'components';
import { communityUrl } from 'utils/canonicalUrls';
import { validateCommunityLandingPageFeature } from 'utils/landingPage/validate';

import FeaturedCommunityPayloadDialog from './FeaturedCommunityPayloadDialog';

type Props = {
	feature: LandingPageCommunityFeature;
	onUpdateFeature: (feature: LandingPageCommunityFeature) => unknown;
};

const FeaturedCommunityItem = (props: Props) => {
	const { feature, onUpdateFeature } = props;
	const { community } = feature;

	const isFeatureValid = useMemo(() => {
		return !!validateCommunityLandingPageFeature(feature);
	}, [feature]);

	const renderTag = () => {
		if (isFeatureValid) {
			return (
				<Tooltip content="Displayed on landing page">
					<Tag icon="tick" intent="success">
						Valid
					</Tag>
				</Tooltip>
			);
		}
		return (
			<Tooltip
				content={
					<>
						This item will not be displayed on the landing page until you use the{' '}
						<Icon icon="edit" /> button to add the required info.
					</>
				}
			>
				<Tag icon="warning-sign" intent="warning">
					Missing info
				</Tag>
			</Tooltip>
		);
	};

	return (
		<div className="landing-page-community-feature">
			<div className="title-group">
				<a href={communityUrl(community)}>{community.title}</a>
				{renderTag()}
			</div>
			<DialogLauncher
				renderLauncherElement={({ openDialog }) => (
					<Button icon="edit" minimal onClick={openDialog} />
				)}
			>
				{({ isOpen, onClose }) => (
					<FeaturedCommunityPayloadDialog
						isOpen={isOpen}
						onClose={onClose}
						feature={feature}
						onSavePayload={(next) =>
							onUpdateFeature({
								...feature,
								payload: next,
							})
						}
					/>
				)}
			</DialogLauncher>
		</div>
	);
};

export default FeaturedCommunityItem;
