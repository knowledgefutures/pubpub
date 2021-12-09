import React, { useState } from 'react';
import { Icon, Popover, Menu, MenuItem } from '@blueprintjs/core';

import { licenses, getLicenseForPub } from 'utils/licenses';
import { usePageContext } from 'utils/hooks';
import { apiFetch } from 'client/utils/apiFetch';
import { Pub, CollectionPub, DefinitelyHas } from 'types';

require('./licenseSelect.scss');

type OwnProps = {
	children: (...args: any[]) => any;
	pubData: Pub & {
		collectionPubs: DefinitelyHas<CollectionPub, 'collection'>[];
	};
	onSelect?: (...args: any[]) => any;
	updateLocalData?: (...args: any[]) => any;
	persistSelections?: boolean;
};

const defaultProps = {
	onSelect: () => {},
	updateLocalData: () => {},
	persistSelections: true,
};

type Props = OwnProps & typeof defaultProps;

const LicenseSelect = (props: Props) => {
	const { children, onSelect, persistSelections, pubData, updateLocalData } = props;
	const [isPersisting, setIsPersisting] = useState(false);
	const { communityData } = usePageContext();
	const currentLicense = getLicenseForPub(pubData, communityData);
	const selectLicense = (license) => {
		onSelect(license);
		if (persistSelections) {
			setIsPersisting(true);
			apiFetch('/api/pubs', {
				method: 'PUT',
				body: JSON.stringify({
					licenseSlug: license.slug,
					pubId: pubData.id,
					communityId: communityData.id,
				}),
			}).then(() => {
				setIsPersisting(false);
				updateLocalData('pub', { licenseSlug: license.slug });
			});
		}
	};

	const renderIcon = (license) => (
		<img width={75} alt="" src={`/static/license/${license.slug}.svg`} />
	);

	const renderMenu = () => {
		return (
			<Menu>
				{licenses
					.filter((license) => {
						return communityData.premiumLicenseFlag || !license.requiresPremium;
					})
					.map((license) => (
						<MenuItem
							key={license.slug}
							onClick={() => selectLicense(license)}
							className="license-select-component__menu-item"
							text={
								<div>
									<div className="title">
										{license.short}{' '}
										{license.link && (
											<a
												href={license.link}
												className="link"
												onClick={(e) => e.stopPropagation()}
												target="_blank"
												rel="noopener noreferrer"
											>
												Learn more
												<Icon iconSize={12} icon="share" />
											</a>
										)}
									</div>
									<div className="full">{license.full}</div>
								</div>
							}
							icon={renderIcon(license)}
							labelElement={
								license.slug === currentLicense.slug && <Icon icon="tick" />
							}
						/>
					))}
			</Menu>
		);
	};
	return (
		<Popover content={renderMenu()}>
			{children({
				icon: renderIcon(currentLicense),
				title: currentLicense.full,
				isPersisting,
			})}
		</Popover>
	);
};
LicenseSelect.defaultProps = defaultProps;
export default LicenseSelect;
