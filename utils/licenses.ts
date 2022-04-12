import { DefinitelyHas, Pub, Community, CollectionPub } from 'types';
import { License, RenderedLicense } from 'types/license';
import { getPubCopyrightYear } from './pub/pubDates';
import { getPublisherString } from './community';

export const licenses: License[] = [
	{
		slug: 'cc-by',
		full: 'Creative Commons Attribution 4.0 International License',
		short: 'CC-BY',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by/4.0/',
	},
	{
		slug: 'cc-0',
		full: 'Creative Commons Public Domain Dedication',
		short: 'CC-0',
		version: '1.0',
		link: 'https://creativecommons.org/publicdomain/zero/1.0/',
	},
	{
		slug: 'cc-by-nc',
		full: 'Creative Commons Attribution-NonCommercial 4.0 International License',
		short: 'CC-BY-NC',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nc/4.0/',
	},
	{
		slug: 'cc-by-nd',
		full: 'Creative Commons Attribution-NoDerivatives 4.0 International License',
		short: 'CC-BY-ND',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nd/4.0/',
	},
	{
		slug: 'cc-by-nc-nd',
		full: 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License',
		short: 'CC-BY-NC-ND',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
	},
	{
		slug: 'cc-by-sa',
		full: 'Creative Commons Attribution-ShareAlike 4.0 International License',
		short: 'CC-BY-SA',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-sa/4.0/',
	},
	{
		slug: 'cc-by-nc-sa',
		full: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License',
		short: 'CC-BY-NC-SA',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
	},
	{
		slug: 'copyright',
		full: 'Copyright © All rights reserved.',
		short: 'Copyright',
		version: null,
		link: null,
		requiresPremium: true,
	},
];

export const getLicenseForPub = (
	pub: Pub & {
		collectionPubs: DefinitelyHas<CollectionPub, 'collection'>[];
	},
	community: Community,
): RenderedLicense => {
	const license = licenses.find((ls) => ls.slug === pub.licenseSlug)!;
	const renderedLicense = {
		...license,
		summary: `${license.slug.toUpperCase()} ${license.version}`,
	};
	const pubCopyrightYear = getPubCopyrightYear(pub);
	const publisherString = getPublisherString(community);
	if (renderedLicense.slug === 'copyright' && publisherString && pubCopyrightYear) {
		renderedLicense.full = `Copyright © ${pubCopyrightYear} ${publisherString}. All rights reserved.`;
		renderedLicense.summary = '';
	}
	return renderedLicense;
};
