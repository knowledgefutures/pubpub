import uuidv4 from 'uuid/v4';

import { Community, Page, Member } from 'server/models';
import { slugifyString } from 'utils/strings';
import { generateHash } from 'utils/hashes';
import { isProd } from 'utils/environment';
import { subscribeUser } from 'server/utils/mailchimp';
import { alertNewCommunity } from 'server/utils/webhooks';
import { updateCommunityData } from 'server/utils/search';

export const createCommunity = (inputValues, userData, alertAndSubscribe = true) => {
	const newCommunityId = uuidv4();
	const homePageId = uuidv4();
	const subdomain = slugifyString(inputValues.subdomain);
	const forbiddenSubdomains = [
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
		'analytics',
		'assets',
		'jake',
		'resize',
		'help',
		'testing',
		'test',
	];
	if (forbiddenSubdomains.indexOf(subdomain) > -1) {
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
				hideCreatePubButton: true,
			});
		})
		.then(() => {
			const newCommunityHomeLayout = JSON.parse(
				'[{"id":"kruw36cv","type":"text","content":{"text":{"type":"doc","attrs":{"meta":{}},"content":[{"type":"heading","attrs":{"level":1,"fixedId":"","id":"welcome-to-your-new-community"},"content":[{"type":"text","text":"🎉 Welcome to your new Community! 🎉"}]},{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"To get started, click the "},{"type":"text","marks":[{"type":"strong"}],"text":"Dashboard"},{"type":"text","text":" button in the top-right corner, and then the "},{"type":"text","marks":[{"type":"strong"}],"text":"Community"},{"type":"text","text":" scope. Here are the basic concepts:"}]},{"type":"bullet_list","content":[{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"Your "},{"type":"text","marks":[{"type":"strong"}],"text":"Community "},{"type":"text","text":"is the workspace where you invite collaborators, design your pages, and write, edit and publish your work. Communities are designed to be flexible, and can host anything from a "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://sharenthood.mitpress.mit.edu/","title":null,"target":null}}],"text":"book"},{"type":"text","text":" or "},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://millie.pubpub.org/","title":null,"target":null}}],"text":"conference"},{"type":"text","text":" to an ongoing "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://hdsr.mitpress.mit.edu","title":null,"target":null}}],"text":"journal"},{"type":"text","text":", "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://punctumbooks.pubpub.org","title":null,"target":null}}],"text":"blog"},{"type":"text","text":", "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://covid-19.mitpress.mit.edu","title":null,"target":null}}],"text":"collection of books"},{"type":"text","text":", and "},{"type":"text","marks":[{"type":"link","attrs":{"href":"https://pubpub.org/explore","title":null,"target":null}}],"text":"much more"},{"type":"text","text":"."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"The "},{"type":"text","marks":[{"type":"strong"}],"text":"Dashboard"},{"type":"text","text":" is where you manage your Community. Pubs, Collections, and your Community as a whole have dashboards where you can filter and search, see important information, change settings, and invite collaborators ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dash/overview","title":null,"target":null}}],"text":"Community Overview Dashboard"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Pubs"},{"type":"text","text":" are the main type of document to use for your work. Pubs allow you to write with collaborators in real-time and invite others to leave feedback in the form of discussion threads and inline annotations (view, create, and filter your Pubs from the "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dash/overview","title":null,"target":null}}],"text":"Community Overview Dashboard"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Pages"},{"type":"text","text":" are for static content (like an about page) and displaying your Pubs (like an issue page). You can customize the layout of individual Pages, including what Pubs/Collections to show ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dash/pages/home","title":null,"target":null}}],"text":"Pages tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Collections"},{"type":"text","text":" are for organizing your Pubs into groups – for example, a journal issue, book, or blog section – and applying common metadata to them. You can associate a Collection with a Page to display thematic groups like journal issues (view, create, and filter your Collections from the "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dash/overview","title":null,"target":null}}],"text":"Community Overview Dashboard"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"You can add additional "},{"type":"text","marks":[{"type":"strong"}],"text":"Members "},{"type":"text","text":"to your entire Community, or to a single Collection or Pub, and give them permissions ranging from read-only to total control ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dash/members","title":null,"target":null}}],"text":"Members tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"You can customize your Community "},{"type":"text","marks":[{"type":"strong"}],"text":"Settings"},{"type":"text","text":" with your own colors, images, navigation bar, footer, etc. ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"/dash/settings","title":null,"target":null}}],"text":"Settings tab"},{"type":"text","text":")."}]}]}]},{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"Or - begin by creating a"},{"type":"text","marks":[{"type":"strong"}],"text":" "},{"type":"text","text":"Pub using the "},{"type":"text","marks":[{"type":"strong"}],"text":"Create Pub"},{"type":"text","text":" button in the top-right corner. Pubs give you the opportunity to edit your documents in real-time with others, and are private until you "},{"type":"text","marks":[{"type":"strong"}],"text":"Publish"},{"type":"text","text":" them."}]}]},"align":"left","title":"🎉 Welcome to your new Community! 🎉","width":"wide"}},{"id":"xw3itri0","type":"pubs","content":{"limit":0,"title":"","pubIds":[],"collectionIds":[],"pubPreviewType":"medium"}}]',
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
			if (alertAndSubscribe && isProd()) {
				subscribeUser(userData.email, 'be26e45660', ['Community Admins']);
				alertNewCommunity(inputValues.title, subdomain, userData.fullName, userData.email);
			}
			return Member.create({
				communityId: newCommunityId,
				userId: userData.id,
				permissions: 'admin',
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
