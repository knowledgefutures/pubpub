import RSS from 'rss';
import { getPubPublishedDate } from 'shared/pub/pubDates';
import { Community, Pub, User, PubAttribution, Release } from '../models';

export const getCommunityRss = (hostname) => {
	const whereQuery =
		hostname.indexOf('.pubpub.org') > -1
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
				attributes: [
					'id',
					'title',
					'slug',
					'draftPermissions',
					'description',
					'avatar',
					'communityId',
					'createdAt',
				],
				separate: true,
				include: [
					{
						model: PubAttribution,
						as: 'attributions',
						required: false,
						include: [
							{
								model: User,
								as: 'user',
								required: false,
								attributes: [
									'id',
									'firstName',
									'lastName',
									'fullName',
									'avatar',
									'slug',
									'initials',
									'title',
								],
							},
						],
					},
					{
						model: Release,
						as: 'releases',
					},
				],
			},
		],
	}).then((communityData) => {
		if (!communityData) {
			throw new Error('Community Not Found');
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
			webMaster: 'hello@pubpub.org',
			language: 'en',
			pubDate: new Date(),
			ttl: '60',
		});
		communityData.pubs
			.map((pub) => {
				const pubJSON = pub.toJSON();
				const publishedDate = getPubPublishedDate(pub);
				if (publishedDate) {
					pubJSON.listedDate = publishedDate;
				}
				return pubJSON;
			})
			.filter((pub) => {
				return pub.listedDate;
			})
			.sort((foo, bar) => {
				if (foo.listedDate < bar.listedDate) {
					return 1;
				}
				if (foo.listedDate > bar.listedDate) {
					return -1;
				}
				return 0;
			})
			.forEach((pub) => {
				const authors = pub.attributions
					.map((attribution) => {
						if (attribution.user) {
							return attribution;
						}
						return {
							...attribution,
							user: {
								id: attribution.id,
								initials: attribution.name[0],
								fullName: attribution.name,
								firstName: attribution.name.split(' ')[0],
								lastName: attribution.name
									.split(' ')
									.slice(1, attribution.name.split(' ').length)
									.join(' '),
								avatar: attribution.avatar,
								title: attribution.title,
							},
						};
					})
					.filter((item) => {
						return item.isAuthor;
					})
					.map((item) => {
						return item.user.fullName;
					})
					.join(', ');

				feed.item({
					title: pub.title,
					description: pub.description,
					url: `${communityUrl}/pub/${pub.slug}`,
					guid: pub.id,
					author: authors,
					date: pub.listedDate,
					enclosure: {
						url: pub.avatar,
					},
				});
			});

		return feed.xml();
	});
};
