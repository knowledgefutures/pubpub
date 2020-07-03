/* eslint-disable no-console */
import { Op } from 'sequelize';
import { Pub, Discussion, includeUserModel } from '../../server/models';

console.log('Beginning Export');

new Promise((resolve) => {
	return resolve();
})
	.then(() => {
		return Pub.findAll({
			where: {
				id: {
					[Op.in]: [
						'777e6397-b3bc-4a02-8e5d-f2326fb713c1',
						'f09d6ea7-a37e-4535-b2b4-0a6ce1612cb7',
						'5f4deb09-ef5e-4199-be21-2dc6f1a1ca35',
						'5623383e-49cf-44a5-8ed9-c8b7de93bf0a',
						'f3abfe2e-9c9d-4a1d-a54b-7753d608a900',
						'c06df4f7-388e-4718-8eee-3d26befeea87',
						'71996bac-a05c-4fbd-8ce2-9dc260a8ffc9',
						'08dae2d0-6bb3-47a2-a560-8e76356001be',
						'116c0203-8ef5-4179-83c6-1e9046431776',
						'2a164e2d-6f08-487e-903f-a04eed09e6c7',
						'b67dd449-e9e8-4826-b24c-ff015efa44c6',
					],
				},
			},
			attributes: ['id', 'title', 'slug', 'description'],
			include: [
				{
					required: false,
					separate: true,
					model: Discussion,
					as: 'discussions',
					attributes: [
						'id',
						'title',
						'threadNumber',
						'text',
						'initAnchorText',
						'createdAt',
					],
					include: [includeUserModel({ as: 'author' })],
				},
			],
		}).then((pubData) => {
			const sortedData = pubData
				.sort((foo, bar) => {
					if (foo.title < bar.title) {
						return -1;
					}
					if (foo.title > bar.title) {
						return 1;
					}
					return 0;
				})
				.map((pub) => {
					return {
						...pub.toJSON(),
						discussions: pub.discussions.sort((boo, baz) => {
							if (boo.threadNumber < baz.threadNumber) {
								return -1;
							}
							if (boo.threadNumber > baz.threadNumber) {
								return 1;
							}
							if (boo.createdAt < baz.createdAt) {
								return -1;
							}
							if (boo.createdAt > baz.createdAt) {
								return 1;
							}
							return 0;
						}),
					};
				});
			console.log(JSON.stringify(sortedData, null, 2));
		});
	})
	.catch((err) => {
		console.log('Error with Export', err);
	})
	.finally(() => {
		console.log('Ending Export');
		process.exit();
	});
