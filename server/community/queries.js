import uuidv4 from 'uuid/v4';
import { Community, Page, CommunityAdmin } from '../models';
import { generateHash, slugifyString } from '../utils';
import { subscribeUser } from '../utils/mailchimp';
import { alertNewCommunity } from '../utils/webhooks';
import { updateCommunityData } from '../utils/search';

export const createCommunity = (inputValues, userData) => {
	const newCommunityId = uuidv4();
	const homePageId = uuidv4();
	const subdomain = slugifyString(inputValues.subdomain);
	const subdomainBlacklist = [
		'v1',
		'v2',
		'v3',
		'v4',
		'v5',
		'v6',
		'v7',
		'v8',
		'www',
		'dev',
		'assets',
		'jake',
		'resize',
		'help',
		'testing',
		'test',
	];
	if (subdomainBlacklist.indexOf(subdomain) > -1) {
		throw new Error('URL already used');
	}
	return Community.findOne({
		where: { subdomain: subdomain },
		attributes: ['id', 'subdomain'],
	})
		.then((existingCommunity) => {
			if (existingCommunity) {
				throw new Error('URL already used');
			}
			const description = inputValues.description.substring(0, 280).replace(/\n/g, ' ') || '';
			return Community.create({
				id: newCommunityId,
				subdomain: subdomain,
				title: inputValues.title,
				description: description,
				headerLogo: inputValues.headerLogo,
				heroLogo: inputValues.heroLogo,
				heroTitle: inputValues.heroLogo ? '' : inputValues.title,
				hideHeaderLogo: true,
				heroText: description,
				accentColorLight: inputValues.accentColorLight,
				accentColorDark: inputValues.accentColorDark,
				navigation: [homePageId],
			});
		})
		.then(() => {
			const newCommunityHomeLayout = JSON.parse(
				'[{"id":"kruw36cv","type":"text","content":{"text":{"type":"doc","attrs":{"meta":{}},"content":[{"type":"paragraph","attrs":{"class":null}},{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"To get started, click the "},{"type":"text","marks":[{"type":"strong"}],"text":"Manage"},{"type":"text","text":" button in the top-right corner. Here are the basic concepts:"}]},{"type":"bullet_list","content":[{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Pubs"},{"type":"text","text":" are the main type of document to use for your articles, books, and manuscripts ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dashboard/pubs","title":null,"target":null}}],"text":"Pubs tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Pages"},{"type":"text","text":" are for static content (like an about page) and displaying your Pubs ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dashboard/page","title":null,"target":null}}],"text":"Create Page tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Collections"},{"type":"text","text":" are for organizing your Pubs onto Pages ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dashboard/collections","title":null,"target":null}}],"text":"Collections tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"You can customize the "},{"type":"text","marks":[{"type":"strong"}],"text":"layout"},{"type":"text","text":" of individual Pages, including what Pubs/Collections to show ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dashboard/pages/","title":null,"target":null}}],"text":"Home Page customization tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"You can add additional Community "},{"type":"text","marks":[{"type":"strong"}],"text":"Admins"},{"type":"text","text":", who can manage everything about your community ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dashboard/team","title":null,"target":null}}],"text":"Team tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"Your "},{"type":"text","marks":[{"type":"strong"}],"text":"Site"},{"type":"text","text":" can be customized with your own colors, images, permissions, etc. ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dashboard/details","title":null,"target":null}}],"text":"Details tab"},{"type":"text","text":")."}]}]}]},{"type":"paragraph","attrs":{"class":null}},{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"Or - begin by creating a "},{"type":"text","marks":[{"type":"strong"}],"text":"New Pub"},{"type":"text","text":" using the button in the top-right corner."}]}]},"align":"left","title":"🎉 Welcome to your new Community! 🎉","width":"wide"}},{"id":"xw3itri0","type":"pubs","content":{"limit":0,"title":"","pubIds":[],"collectionIds":[],"pubPreviewType":"medium"}}]',
			);
			const newpage = {
				id: homePageId,
				title: 'Home',
				slug: '',
				communityId: newCommunityId,
				isPublic: true,
				layout: newCommunityHomeLayout,
				viewHash: generateHash(8),
			};
			return Page.create(newpage);
		})
		.then(() => {
			subscribeUser(userData.email, '2847d5271c', ['Community Admins']);
			alertNewCommunity(inputValues.title, subdomain, userData.fullName, userData.email);
			return CommunityAdmin.create({
				communityId: newCommunityId,
				userId: userData.id,
			});
		})
		.then(() => {
			return { subdomain: subdomain };
		});
};

export const updateCommunity = (inputValues, updatePermissions) => {
	// Filter to only allow certain fields to be updated
	const filteredValues = {};
	Object.keys(inputValues).forEach((key) => {
		if (updatePermissions.includes(key)) {
			filteredValues[key] = inputValues[key];
		}
	});
	if (filteredValues.subdomain) {
		filteredValues.subdomain = slugifyString(filteredValues.subdomain);
	}

	return Community.update(filteredValues, {
		where: { id: inputValues.communityId },
	}).then(() => {
		updateCommunityData(inputValues.communityId);
		return filteredValues;
	});
};
