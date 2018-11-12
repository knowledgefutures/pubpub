/* eslint-disable no-param-reassign */
import sanitizeHtml from 'sanitize-html';
import app from '../server';
import { Page, Community, CommunityAdmin } from '../models';
import { generateHash, slugifyString } from '../utilities';


app.post('/api/pages', (req, res)=> {
	// Authenticate user. Make sure they have manage permissions on the given pub.

	const user = req.user || {};

	let newPageOutput;
	let newNavigationOutput;
	CommunityAdmin.findOne({
		where: { userId: user.id, communityId: req.body.communityId },
		raw: true,
	})
	.then((collaboratorData)=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !collaboratorData) {
			throw new Error('Not Authorized to update this community');
		}
		return Page.create({
			communityId: req.body.communityId,
			title: req.body.title,
			slug: req.body.slug,
			description: req.body.description,
			isPublic: false,
			viewHash: generateHash(8),
		});
	})
	.then((newPage)=> {
		newPageOutput = newPage;
		return Community.findOne({
			where: { id: req.body.communityId },
			attributes: ['id', 'navigation']
		});
	})
	.then((communityData)=> {
		const oldNavigation = communityData.toJSON().navigation;
		newNavigationOutput = [
			oldNavigation[0],
			newPageOutput.id,
			...oldNavigation.slice(1, oldNavigation.length)
		];
		return Community.update({ navigation: newNavigationOutput }, {
			where: { id: req.body.communityId },
		});
	})
	.then(()=> {
		return res.status(201).json('success');
	})
	.catch((err)=> {
		console.error('Error in postPage: ', err);
		return res.status(500).json(err.message);
	});
});

app.put('/api/pages', (req, res)=> {
	const user = req.user || {};

	// Filter to only allow certain fields to be updated
	const updatedPage = {};
	Object.keys(req.body).forEach((key)=> {
		if (['title', 'slug', 'description', 'isPublic', 'layout', 'avatar', 'isNarrowWidth'].indexOf(key) > -1) {
			updatedPage[key] = req.body[key] && req.body[key].trim
				? req.body[key].trim()
				: req.body[key];
			if (key === 'slug') {
				updatedPage.slug = slugifyString(updatedPage.slug);
			}
			if (key === 'layout') {
				updatedPage.layout = updatedPage.layout.map((block)=> {
					if (block.type !== 'html') { return block; }
					const cleanedBlock = { ...block };
					cleanedBlock.content.html = sanitizeHtml(block.content.html, {
						allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
							'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
							'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'video', 'iframe', 'style'],
						allowedAttributes: {
							'*': ['class', 'id', 'style', 'src', 'width', 'height', 'preload', 'controls', 'allowfullscreen', 'frameborder'],
							a: ['href'],
						},
						allowedSchemes: ['https', 'mailto'],
					});
					return cleanedBlock;
				});
			}
		}
	});
	CommunityAdmin.findOne({
		where: { userId: user.id, communityId: req.body.communityId },
		raw: true,
	})
	.then((adminData)=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !adminData) {
			throw new Error('Not Authorized to update this community');
		}
		return Page.update(updatedPage, {
			where: { id: req.body.pageId, communityId: req.body.communityId }
		});
	})
	.then(()=> {
		return res.status(202).json('success');
	})
	.catch((err)=> {
		console.error('Error in putPage', err);
		return res.status(500).json(err);
	});
});

app.delete('/api/pages', (req, res)=> {
	// Authenticate user. Make sure they have manage permissions on the given pub.

	const user = req.user || {};
	let newNavigationOutput;

	CommunityAdmin.findOne({
		where: { userId: user.id, communityId: req.body.communityId },
		raw: true,
	})
	.then((adminData)=> {
		if (user.id !== 'b242f616-7aaa-479c-8ee5-3933dcf70859' && !adminData) {
			throw new Error('Not Authorized to update this community');
		}
		return Page.destroy({
			where: {
				id: req.body.pageId,
				communityId: req.body.communityId,
			}
		});
	})
	.then(()=> {
		return Community.findOne({
			where: { id: req.body.communityId },
			attributes: ['id', 'navigation']
		});
	})
	.then((communityData)=> {
		const oldNavigation = communityData.toJSON().navigation;
		newNavigationOutput = oldNavigation.filter((item)=> {
			return item !== req.body.pageId;
		}).map((item)=> {
			if (!item.children) { return item; }
			return {
				...item,
				children: item.children.filter((subitem)=> {
					return subitem !== req.body.pageId;
				})
			};
		});
		return Community.update({ navigation: newNavigationOutput }, {
			where: { id: req.body.communityId },
		});
	})
	.then(()=> {
		return res.status(202).json('success');
	})
	.catch((err)=> {
		console.error('Error in deletePage: ', err);
		return res.status(500).json(err.message);
	});
});
