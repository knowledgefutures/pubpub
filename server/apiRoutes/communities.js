import uuidv4 from 'uuid/v4';
import Color from 'color';
import app from '../server';
import { Community, Page, CommunityAdmin } from '../models';
import { generateHash, slugifyString } from '../utilities';

app.post('/api/communities', (req, res)=> {
	const user = req.user || {};
	if (!user.id) { return res.status(500).json('Must be logged in to create a community'); }

	const newCommunityId = uuidv4();
	const homePageId = uuidv4();
	const subdomain = slugifyString(req.body.subdomain);

	const subdomainBlacklist = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'www', 'dev', 'assets', 'jake', 'resize', 'help', 'testing', 'test'];
	if (subdomainBlacklist.indexOf(subdomain) > -1) { return res.status(500).json('URL already used'); }

	const newCommunityHomeLayout = JSON.parse('[{"id":"kruw36cv","type":"text","content":{"text":{"type":"doc","attrs":{"meta":{}},"content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"To get started, click the \'Manage\' button in the top-right corner. Here are the basic concepts:"}]},{"type":"bullet_list","content":[{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Pubs"},{"type":"text","text":" are the main type of document to use for your articles, books, and manuscripts ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://localhost:9876/dashboard/pubs","title":null,"target":null}}],"text":"Pubs tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Pages"},{"type":"text","text":" are for static content (like an about page) and displaying your Pubs ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://localhost:9876/dashboard/page","title":null,"target":null}}],"text":"Create Page tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","marks":[{"type":"strong"}],"text":"Tags"},{"type":"text","text":" are for organizing your Pubs onto Pages ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://localhost:9876/dashboard/tags","title":null,"target":null}}],"text":"Tags tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"You can customize the "},{"type":"text","marks":[{"type":"strong"}],"text":"layout"},{"type":"text","text":" of individual Pages, including what Pubs/Tags to show ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://localhost:9876/dashboard/pages/","title":null,"target":null}}],"text":"Home Page customization tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"You can add additional Community "},{"type":"text","marks":[{"type":"strong"}],"text":"Admins"},{"type":"text","text":", who can manage everything about your community ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://localhost:9876/dashboard/team","title":null,"target":null}}],"text":"Team tab"},{"type":"text","text":")."}]}]},{"type":"list_item","content":[{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"Your "},{"type":"text","marks":[{"type":"strong"}],"text":"Site"},{"type":"text","text":" can be customized with your own colors, images, permissions, etc. ("},{"type":"text","marks":[{"type":"link","attrs":{"href":"http://localhost:9876/dashboard/details","title":null,"target":null}}],"text":"Details tab"},{"type":"text","text":")."}]}]}]},{"type":"paragraph","attrs":{"class":null},"content":[{"type":"text","text":"Or - begin by creating a "},{"type":"text","marks":[{"type":"strong"}],"text":"New Pub"},{"type":"text","text":" using the button in the top-right corner."}]}]},"align":"left","title":"🎉 Welcome to your new Community! 🎉","width":"wide"}},{"id":"xw3itri0","type":"pubs","content":{"title":"","pubPreviewType":"medium","limit":0,"pubIds":[],"tagIds":[]}}]');
	const newpage = {
		id: homePageId,
		title: 'Home',
		slug: '',
		communityId: newCommunityId,
		isPublic: true,
		layout: newCommunityHomeLayout,
		viewHash: generateHash(8),
	};

	return Community.findOne({
		where: { subdomain: subdomain },
		attributes: ['id', 'subdomain']
	})
	.then((existingCommunity)=> {
		if (existingCommunity) {
			throw new Error('URL already used');
		}
		return Community.create({
			id: newCommunityId,
			subdomain: subdomain,
			title: req.body.title,
			description: req.body.description.substring(0, 280).replace(/\n/g, ' ') || '',
			smallHeaderLogo: req.body.smallHeaderLogo,
			largeHeaderLogo: req.body.largeHeaderLogo,
			accentColor: req.body.accentColor,
			accentTextColor: Color(req.body.accentColor).isLight() ? '#000000' : '#FFFFFF',
			accentHoverColor: Color(req.body.accentColor).fade(0.2).rgb().string(),
			accentActionColor: Color(req.body.accentColor).fade(0.4).rgb().string(),
			accentMinimalColor: Color(req.body.accentColor).fade(0.8).rgb().string(),
			navigation: [homePageId],
		});
	})
	.then(()=> {
		return Page.create(newpage);
	})
	.then(()=> {
		return CommunityAdmin.create({
			communityId: newCommunityId,
			userId: user.id
		});
	})
	.then(()=> {
		return res.status(201).json(`https://${subdomain}.pubpub.org`);
	})
	.catch((err)=> {
		if (err.message === 'URL already used') {
			return res.status(500).json('URL already used');
		}
		console.error('Error posting Community', err);
		return res.status(500).json('Error Creating Community');
	});
});


app.put('/api/communities', (req, res)=> {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedCommunity = {};
	Object.keys(req.body).forEach((key)=> {
		if ([
			'title',
			'subdomain',
			'description',
			'avatar',
			'favicon',
			'smallHeaderLogo',
			'largeHeaderLogo',
			'largeHeaderBackground',
			'accentColor',
			'navigation',
			'website',
			'twitter',
			'facebook',
			'email',
			'hideCreatePubButton',
			'defaultPubTags',
		].indexOf(key) > -1) {
			updatedCommunity[key] = req.body[key] && req.body[key].trim ? req.body[key].trim() : req.body[key];
		}
	});
	if (updatedCommunity.subdomain) {
		updatedCommunity.subdomain = slugifyString(updatedCommunity.subdomain);
	}
	if (updatedCommunity.accentColor) {
		const accentColor = updatedCommunity.accentColor;
		updatedCommunity.accentTextColor = Color(accentColor).isLight() ? '#000000' : '#FFFFFF';
		updatedCommunity.accentHoverColor = Color(accentColor).fade(0.2).rgb().string();
		updatedCommunity.accentActionColor = Color(accentColor).fade(0.4).rgb().string();
		updatedCommunity.accentMinimalColor = Color(accentColor).fade(0.8).rgb().string();
	}

	CommunityAdmin.findOne({
		where: { userId: user.id, communityId: req.body.communityId },
		raw: true,
	})
	.then((collaboratorData)=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !collaboratorData) {
			throw new Error('Not Authorized to update this community');
		}
		return Community.update(updatedCommunity, {
			where: { id: req.body.communityId }
		});
	})
	.then(()=> {
		return res.status(201).json(updatedCommunity);
	})
	.catch((err)=> {
		console.error('Error putting Pub', err);
		return res.status(500).json(err);
	});
});
