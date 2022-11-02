import React, { useMemo } from 'react';

import { FacetEditor, PopoverButton } from 'components';
import { usePageContext } from 'utils/hooks';
import { renderLicenseForPub } from 'utils/licenses';
import { useFacetsQuery } from 'client/utils/useFacets';

import { usePubContext } from '../../pubHooks';
import PubBottomSection, { AccentedIconButton, SectionBullets } from './PubBottomSection';

const LicenseSection = () => {
	const { pubData } = usePubContext();
	const { communityData, scopeData } = usePageContext();
	const license = useFacetsQuery((F) => F.License);
	const { collectionPubs } = pubData;

	const { link, full, kind, summary } = useMemo(
		() =>
			renderLicenseForPub({
				pub: pubData,
				community: communityData,
				license,
				collectionPubs,
			}),
		[pubData, communityData, license, collectionPubs],
	);

	return (
		<PubBottomSection
			accentColor={communityData.accentColorDark}
			isExpandable={false}
			className="pub-bottom-license"
			title="License"
			centerItems={
				<React.Fragment>
					<SectionBullets>
						<a
							target="_blank"
							rel="license noopener noreferrer"
							className="license-link"
							href={link!}
						>
							<img
								width={75}
								alt=""
								src={`/static/license/${kind}.svg`}
								className="license-image"
							/>
							{full} {summary && `(${summary})`}
						</a>
					</SectionBullets>
				</React.Fragment>
			}
			iconItems={({ iconColor }) => {
				if (!scopeData.activePermissions.canManage) {
					return null;
				}
				return (
					<PopoverButton
						component={() => <FacetEditor facetName="License" selfContained />}
						placement="top-end"
						aria-label="Edit license"
						facetName="License"
					>
						<AccentedIconButton icon="edit" accentColor={iconColor} />
					</PopoverButton>
				);
			}}
		/>
	);
};
export default LicenseSection;
