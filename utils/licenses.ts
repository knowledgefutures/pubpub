import { FacetValue, License } from 'facets';
import { DefinitelyHas, Pub, Community, CollectionPub } from 'types';
import { LicenseDetails, LicenseKind, RenderedLicense } from 'types/license';
import { getPublisherString } from 'utils/community';
import { getPubCopyrightYear } from 'utils/pub/copyright';
import { assert } from 'utils/assert';

export const licenseDetailsByKind: { [L in LicenseKind]: LicenseDetails<L> } = {
	'cc-by': {
		kind: 'cc-by',
		full: 'Creative Commons Attribution 4.0 International License',
		short: 'CC-BY',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by/4.0/',
	},
	'cc-0': {
		kind: 'cc-0',
		full: 'Creative Commons Public Domain Dedication',
		short: 'CC-0',
		version: '1.0',
		link: 'https://creativecommons.org/publicdomain/zero/1.0/',
	},
	'cc-by-nc': {
		kind: 'cc-by-nc',
		full: 'Creative Commons Attribution-NonCommercial 4.0 International License',
		short: 'CC-BY-NC',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nc/4.0/',
	},
	'cc-by-nd': {
		kind: 'cc-by-nd',
		full: 'Creative Commons Attribution-NoDerivatives 4.0 International License',
		short: 'CC-BY-ND',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nd/4.0/',
	},
	'cc-by-nc-nd': {
		kind: 'cc-by-nc-nd',
		full: 'Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License',
		short: 'CC-BY-NC-ND',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
	},
	'cc-by-sa': {
		kind: 'cc-by-sa',
		full: 'Creative Commons Attribution-ShareAlike 4.0 International License',
		short: 'CC-BY-SA',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-sa/4.0/',
	},
	'cc-by-nc-sa': {
		kind: 'cc-by-nc-sa',
		full: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License',
		short: 'CC-BY-NC-SA',
		version: '4.0',
		link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
	},
	copyright: {
		kind: 'copyright',
		full: 'Copyright © All rights reserved.',
		short: 'Copyright',
		version: null,
		link: null,
		requiresPremium: true,
	},
};

type RenderLicenseForPubOptions = {
	license: FacetValue<typeof License>;
	collectionPubs: DefinitelyHas<CollectionPub, 'collection'>[];
	pub: Pub;
	community: Community;
};

export const renderLicenseForPub = (options: RenderLicenseForPubOptions): RenderedLicense => {
	const { license, collectionPubs, pub, community } = options;
	const { short, full, link, version, kind } = licenseDetailsByKind[license.kind as LicenseKind];
	if (kind === 'copyright') {
		const publisher = getPublisherString(community);
		const { year } = getPubCopyrightYear({
			license,
			collectionPubs,
			pub,
		});
		assert(typeof year === 'number');
		return {
			kind,
			short,
			full: `Copyright © ${year} ${publisher}. All rights reserved.`,
			link: null,
			summary: null,
		};
	}
	return {
		kind,
		short,
		full,
		link,
		summary: `${kind.toUpperCase()} ${version}`,
	};
};
