import app from '../server';
// import { User, Pub, Discussion, Collaborator, Collection, Community } from '../models';
import { User } from '../models';

app.get('/api/search/users', (req, res) => {
	User.findAll({
		where: {
			$or: [
				{ fullName: { $ilike: `%${req.query.q}%` } },
				{ slug: { $ilike: `%${req.query.q}%` } },
			],
		},
		attributes: ['id', 'slug', 'fullName', 'initials', 'avatar'],
		limit: 5,
	})
		.then((results) => {
			return res.status(201).json(results);
		})
		.catch((err) => {
			console.error('Error in searchUsers: ', err);
			return res.status(500).json(err.message);
		});
});

// app.get('/api/search/pubs', (req, res)=> {
// 	console.time('PubSearch');
// 	const searchTerms = [
// 		{
// 			$or: [
// 				{ title: { $ilike: `%${req.query.q}%` } },
// 				{ description: { $ilike: `%${req.query.q}%` } },
// 			]
// 		},
// 		{
// 			$or: [
// 				{ firstPublishedAt: { $ne: null } },
// 				{ collaborationMode: 'publicView' },
// 				{ collaborationMode: 'publicEdit' },
// 			]
// 		}
// 	];

// 	const includes = [
// 		{
// 			model: Collection,
// 			as: 'collections',
// 			where: { isPublic: true },
// 			attributes: ['id', 'isPublic'],
// 			through: { attributes: [] },
// 		},
// 		{
// 			model: User,
// 			as: 'collaborators',
// 			attributes: ['id', 'avatar', 'initials', 'fullName'],
// 			through: { attributes: ['isAuthor'] },
// 		},
// 		{
// 			required: false,
// 			model: Collaborator,
// 			as: 'emptyCollaborators',
// 			where: { userId: null },
// 			attributes: { exclude: ['createdAt', 'updatedAt'] },
// 		},
// 		{
// 			required: false,
// 			separate: true,
// 			model: Discussion,
// 			as: 'discussions',
// 			attributes: ['suggestions', 'pubId']
// 		},
// 	];
// 	if (req.query.communityId) {
// 		searchTerms.push({ communityId: req.query.communityId });
// 	}
// 	if (!req.query.communityId) {
// 		includes.push({
// 			model: Community,
// 			as: 'community',
// 			attributes: ['id', 'subdomain', 'domain', 'title', 'smallHeaderLogo', 'accentColor'],
// 		});
// 	}

// 	Pub.findAll({
// 		where: {
// 			$and: searchTerms
// 		},
// 		attributes: {
// 			exclude: ['editHash', 'viewHash'],
// 		},
// 		limit: 10,
// 		include: includes
// 	})
// 	.then((results)=> {
// 		console.timeEnd('PubSearch');
// 		console.time('PubSearchProcess');
// 		const output = results.map((pubObject)=> {
// 			const pub = pubObject.toJSON();
// 			return {
// 				...pub,
// 				discussionCount: pub.discussions ? pub.discussions.length : 0,
// 				suggestionCount: pub.discussions ? pub.discussions.reduce((prev, curr)=> {
// 					if (curr.suggestions) { return prev + 1; }
// 					return prev;
// 				}, 0) : 0,
// 				collaboratorCount: pub.collaborators.length + pub.emptyCollaborators.length,
// 				discussions: undefined,
// 				collaborators: [
// 					...pub.collaborators,
// 					...pub.emptyCollaborators.map((item)=> {
// 						return {
// 							id: item.id,
// 							initials: item.name[0],
// 							fullName: item.name,
// 							Collaborator: {
// 								id: item.id,
// 								isAuthor: item.isAuthor,
// 								permissions: item.permissions,
// 								order: item.order,
// 							}
// 						};
// 					})
// 				],
// 				emptyCollaborators: undefined,
// 			};
// 		});
// 		console.timeEnd('PubSearchProcess');
// 		return res.status(201).json(output);
// 	})
// 	.catch((err)=> {
// 		console.error('Error in searchUsers: ', err);
// 		return res.status(500).json(err.message);
// 	});
// });
