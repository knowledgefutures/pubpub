import type { LandingPageFeatures as LandingPageFeaturesType } from 'types';

import React from 'react';

import { SettingsSection } from 'components';
import { expect } from 'utils/assert';
import { communityUrl, pubUrl } from 'utils/canonicalUrls';

import FeaturedCommunityItem from './FeaturedCommunityItem';
import LandingPageFeatureManager, { type RenderFeatureProps } from './LandingPageFeatureManager';

import './landingPageFeatures.scss';

type Props = {
	landingPageFeatures: LandingPageFeaturesType<false>;
};

const LandingPageFeatures = (props: Props) => {
	const { landingPageFeatures } = props;

	const renderPubFeature = ({ feature }: RenderFeatureProps<'pub'>) => {
		const { pub } = feature;
		const { community } = pub;
		return (
			<div className="landing-page-pub-feature">
				<div className="title">
					<a href={pubUrl(community ?? null, pub)}>{pub.title}</a>
				</div>
				<div className="community">
					in <a href={communityUrl(expect(community))}>{expect(community).title}</a>
				</div>
			</div>
		);
	};

	const renderCommunityFeature = ({
		feature,
		onUpdateFeature,
	}: RenderFeatureProps<'community'>) => {
		return <FeaturedCommunityItem feature={feature} onUpdateFeature={onUpdateFeature} />;
	};

	return (
		<div className="landing-page-features-component">
			<SettingsSection key={0} title="Pubs">
				<LandingPageFeatureManager
					kind="pub"
					placeholder="Enter a Pub slug or URL"
					initialFeatures={landingPageFeatures.pub}
					renderFeature={renderPubFeature}
				/>
			</SettingsSection>
			<SettingsSection key={1} title="Communities">
				<LandingPageFeatureManager
					kind="community"
					placeholder="Enter a Community subdomain or URL"
					initialFeatures={landingPageFeatures.community}
					renderFeature={renderCommunityFeature}
				/>
			</SettingsSection>
		</div>
	);
};

export default LandingPageFeatures;
