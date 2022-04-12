import React from 'react';

import { LicenseSelect } from 'components';
import { usePageContext } from 'utils/hooks';
import { getLicenseForPub } from 'utils/licenses';
import { PubPageData } from 'types';

import PubBottomSection, { SectionBullets, AccentedIconButton } from './PubBottomSection';

type Props = {
	pubData: PubPageData;
	updateLocalData: (...args: any[]) => any;
};

const LicenseSection = (props: Props) => {
	const { pubData, updateLocalData } = props;
	const { communityData, scopeData } = usePageContext();
	const { link, full, slug, summary } = getLicenseForPub(pubData, communityData);

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
								src={`/static/license/${slug}.svg`}
								className="license-image"
							/>
							{full} {summary && `(${summary})`}
						</a>
					</SectionBullets>
				</React.Fragment>
			}
			iconItems={({ iconColor }) => {
				if (scopeData.activePermissions.canManage) {
					return (
						<LicenseSelect pubData={pubData as any} updateLocalData={updateLocalData}>
							{({ isPersisting }) => (
								<AccentedIconButton
									accentColor={iconColor}
									icon="edit"
									title="Select Pub license"
									loading={isPersisting}
								/>
							)}
						</LicenseSelect>
					);
				}
				return null;
			}}
		/>
	);
};
export default LicenseSection;
