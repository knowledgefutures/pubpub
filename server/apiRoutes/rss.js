import RSS from 'rss';
import app from '../server';
import { Community, Pub, User, PubAttribution, Version } from '../models';

app.get('/rss.xml', (req, res)=> {
	const hostname = req.hostname;
	const whereQuery = hostname.indexOf('.pubpub.org') > -1
		? { subdomain: hostname.replace('.pubpub.org', '') }
		: { domain: hostname };

	return Community.findOne({
		where: whereQuery,
		attributes: ['id', 'subdomain', 'domain', 'title', 'description', 'favicon'],
		include: [
			{
				model: Pub,
				as: 'pubs',
				through: { attributes: [] },
				attributes: ['id', 'title', 'slug', 'draftPermissions', 'description', 'avatar', 'communityId', 'createdAt'],
				separate: true,
				include: [
					{
						model: PubAttribution,
						as: 'attributions',
						required: false,
						include: [{ model: User, as: 'user', required: false, attributes: ['id', 'firstName', 'lastName', 'fullName', 'avatar', 'slug', 'initials', 'title'] }],
					},
					{
						model: Version,
						required: false,
						as: 'versions',
						attributes: ['id', 'isPublic', 'createdAt']
					},
				]
			},
		],
	})
	.then((communityData)=> {
		if (!communityData) {
			throw new Error('No communityData');
		}
		const communityUrl = communityData.domain
			? `https://${communityData.domain}`
			: `https://${communityData.subdomain}.pubpub.org`;
		const feed = new RSS({
			title: communityData.title,
			description: communityData.description,
			feed_url: `${communityUrl}/rss.xml`,
			site_url: communityUrl,
			image_url: communityData.favicon,
			webMaster: 'team@pubpub.org',
			language: 'en',
			pubDate: new Date(),
			ttl: '60',
		});

		communityData.pubs.map((pub)=> {
			const pubJSON = pub.toJSON();
			if (pub.draftPermissions !== 'private') {
				pubJSON.listedDate = pub.createdAt;
			}
			const publicVersions = pub.versions.filter((version)=> {
				return version.isPublic;
			}).sort((foo, bar)=> {
				if (foo.createdAt < bar.createdAt) { return -1; }
				if (foo.createdAt > bar.createdAt) { return 1; }
				return 0;
			});
			if (publicVersions.length) {
				pubJSON.listedDate = publicVersions[0].createdAt;
			}
			return pubJSON;
		}).filter((pub)=> {
			return pub.listedDate;
		}).sort((foo, bar)=> {
			if (foo.listedDate < bar.listedDate) { return 1; }
			if (foo.listedDate > bar.listedDate) { return -1; }
			return 0;
		}).forEach((pub)=> {
			const authors = pub.attributions.map((attribution)=> {
				if (attribution.user) { return attribution; }
				return {
					...attribution,
					user: {
						id: attribution.id,
						initials: attribution.name[0],
						fullName: attribution.name,
						firstName: attribution.name.split(' ')[0],
						lastName: attribution.name.split(' ').slice(1, attribution.name.split(' ').length).join(' '),
						avatar: attribution.avatar,
						title: attribution.title
					}
				};
			}).filter((item)=> {
				return item.isAuthor;
			}).map((item)=> {
				return item.user.fullName;
			}).join(', ');

			feed.item({
				title: pub.title,
				description: pub.description,
				url: `${communityUrl}/pub/${pub.slug}`,
				guid: pub.id,
				author: authors,
				date: pub.firstPublishedAt,
				enclosure: {
					url: pub.avatar
				}
			});
		});

		const outputXML = feed.xml();
		res.set('Content-Type', 'text/xml');
		return res.send(outputXML);
	})
	.catch((err)=> {
		console.error(err);
		return res.status(200).json('Error producing RSS feed');
	});
});
