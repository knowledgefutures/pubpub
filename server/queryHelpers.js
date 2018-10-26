import Promise from 'bluebird';
import validator from 'validator';
import { User, Collection, Pub, Collaborator, Discussion, CommunityAdmin, Community, Version, PubManager, PubAttribution, VersionPermission, Tag, PubTag, Page, DiscussionChannel, DiscussionChannelParticipant } from './models';
import { generateCitationHTML } from './utilities';

export const formatAndAuthenticatePub = (pub, loginData, communityAdminData, req, isDraftRoute)=> {
	/* Used to format pub JSON and to test */
	/* whether the user has permissions */
	const isPubPubAdmin = loginData.id === 14;
	const isCommunityAdminManager = communityAdminData && pub.isCommunityAdminManaged;
	const isManager = pub.managers.reduce((prev, curr)=> {
		if (curr.userId === loginData.id) { return true; }
		return prev;
	}, isCommunityAdminManager || isPubPubAdmin);

	const allowedVersions = pub.versions.sort((foo, bar)=> {
		if (foo.createdAt > bar.createdAt) { return -1; }
		if (foo.createdAt < bar.createdAt) { return 1; }
		return 0;
	}).filter((version)=> {
		if (version.isPublic) { return true; }
		if (isManager) { return true; }
		if (version.id === req.query.version && version.viewHash === req.query.access) { return true; }
		return pub.versionPermissions.reduce((prev, curr)=> {
			if (version.id === curr.versionId && curr.userId === loginData.id) {
				return true;
			}
			return prev;
		}, false);
	});
	const activeVersion = allowedVersions.reduce((prev, curr, index)=> {
		if (index === 0) { return curr; }
		if (req.query.version === curr.id) { return curr; }
		return prev;
	}, {});

	const isCommunityAdminViewer = communityAdminData && pub.communityAdminDraftPermissions === 'view';
	const isCommunityAdminEditor = communityAdminData && pub.communityAdminDraftPermissions === 'edit';

	const isValidViewHash = isDraftRoute
		? req.query.access && req.query.access === pub.draftViewHash
		: req.query.access && req.query.access === activeVersion.viewHash;
	const isValidEditHash = isDraftRoute && req.query.access === pub.draftEditHash;

	const isDraftEditor = pub.versionPermissions.reduce((prev, curr)=> {
		if (curr.userId === loginData.id
			&& !curr.versionId
			&& curr.permissions === 'edit'
		) { return true; }
		return prev;
	}, isCommunityAdminEditor || isValidEditHash || pub.draftPermissions === 'publicEdit');
	const isDraftViewer = pub.versionPermissions.reduce((prev, curr)=> {
		if (curr.userId === loginData.id
			&& !curr.versionId
			&& curr.permissions === 'view'
		) { return true; }
		return prev;
	}, isCommunityAdminViewer || isValidViewHash || pub.draftPermissions === 'publicView');

	const isVersionViewer = pub.versionPermissions.reduce((prev, curr)=> {
		if (curr.userId === loginData.id
			&& curr.versionId === activeVersion.id
			&& curr.permissions === 'edit'
		) { return true; }
		return prev;
	}, isManager || isValidViewHash || (activeVersion && activeVersion.isPublic));

	const formattedPubData = {
		...pub,
		versions: allowedVersions.map((version)=> {
			if (isManager) { return version; }
			return {
				...version,
				viewHash: undefined,
			};
		}),
		activeVersion: activeVersion,
		attributions: pub.attributions.map((attribution)=> {
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
		}),
		discussions: pub.discussions
			? pub.discussions.filter((item)=> {
				// TODO: filter based on discussion group access
				// return item.isPublic || isManager;
				return !item.discussionChannelId || isManager;
			}).map((item)=> {
				if (!isManager && item.submitHash) {
					return { ...item, submitHash: 'present' };
				}
				return item;
			})
			: undefined,
		// collections: pub.collections
		// 	? pub.collections.filter((item)=> {
		// 		return item.isPublic || communityAdminData;
		// 	})
		// 	: undefined,
		pubTags: pub.pubTags.map((item)=> {
			if (!communityAdminData && item.tag && !item.tag.isPublic) {
				return {
					...item,
					tag: undefined
				};
			}
			return item;
		}).filter((item)=> {
			return !item.tag || item.tag.isPublic || communityAdminData;
		}),
		discussionChannels: pub.discussionChannels
			? pub.discussionChannels.filter((channel)=> {
				const isPrivate = channel.permissions === 'private';
				const isParticipant = channel.participants.reduce((prev, curr)=> {
					if (curr.userId === loginData.id) { return true; }
					return prev;
				}, false);
				const permissionAsAdmin = channel.isCommunityAdminModerated && loginData.isAdmin;

				if (!isPrivate || isParticipant || permissionAsAdmin) { return true; }
				return false;
			})
			: undefined,
		isManager: isManager,
		isDraftEditor: isDraftEditor,
		isDraftViewer: isDraftViewer,
		isVersionViewer: isVersionViewer,
		isDraft: isDraftRoute || !allowedVersions.length,
		hasDraftAccess: isManager || isDraftViewer || isDraftEditor,
		hasVersionAccess: isManager || isVersionViewer,
	};

	if (!isManager) {
		formattedPubData.draftViewHash = undefined;
		formattedPubData.draftEditHash = undefined;
	}

	/* Ensure access of some kind */
	if (!formattedPubData.hasDraftAccess && !formattedPubData.hasVersionAccess) {
		return null;
	}

	return formattedPubData;
};

export const findPub = (req, initialData, isDraftRoute)=> {
	if (req.query.version && !validator.isUUID(req.query.version)) {
		throw new Error('Pub Not Found');
	}

	const getPubData = Pub.findOne({
		where: {
			slug: req.params.slug.toLowerCase(),
			communityId: initialData.communityData.id,
		},
		include: [
			{
				model: PubManager,
				as: 'managers',
				separate: true,
				include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'fullName', 'avatar', 'slug', 'initials', 'title'] }],
			},
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				separate: true,
				include: [{ model: User, as: 'user', required: false, attributes: ['id', 'firstName', 'lastName', 'fullName', 'avatar', 'slug', 'initials', 'title'] }],
			},
			{
				model: VersionPermission,
				as: 'versionPermissions',
				separate: true,
				required: false,
				include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'fullName', 'avatar', 'slug', 'initials', 'title'] }],
			},
			{
				model: PubTag,
				as: 'pubTags',
				required: false,
				separate: true,
				include: [{
					model: Tag,
					as: 'tag',
					include: [{ model: Page, as: 'page', required: false, attributes: ['id', 'title', 'slug'] }]
				}],
			},
			{
				required: false,
				separate: true,
				model: Discussion,
				as: 'discussions',
				include: [{ model: User, as: 'author', attributes: ['id', 'fullName', 'avatar', 'slug', 'initials', 'title'] }],
			},
			{
				// TODO: Need to filter for discussion channels and discussions you have access to.
				required: false,
				separate: true,
				model: DiscussionChannel,
				as: 'discussionChannels',
				include: [{ model: DiscussionChannelParticipant, as: 'participants', include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'avatar', 'slug', 'initials', 'title'] }] }]
			},
			// {
			// 	required: false,
			// 	model: Page,
			// 	as: 'pages',
			// 	attributes: ['id', 'title', 'slug', 'isPublic'],
			// 	through: { attributes: [] },
			// },
			{
				required: false,
				// separate: true,
				model: Version,
				as: 'versions',
				attributes: ['createdAt', 'id', 'description', 'isPublic', 'isCommunityAdminShared', 'viewHash']
			},
		]
	});

	const getCommunityAdminData = CommunityAdmin.findOne({
		where: {
			userId: initialData.loginData.id,
			communityId: initialData.communityData.id,
		}
	});
	return Promise.all([getPubData, getCommunityAdminData])
	.then(([pubData, communityAdminData])=> {
		if (!pubData) { throw new Error('Pub Not Found'); }
		const pubDataJson = pubData.toJSON();
		const formattedPubData = formatAndAuthenticatePub(pubDataJson, initialData.loginData, communityAdminData, req, isDraftRoute);

		if (!formattedPubData) {
			throw new Error('Pub Not Found');
		}
		if (!isDraftRoute && formattedPubData.isDraft) {
			throw new Error(`DraftRedirect:${req.params.slug}`);
		}
		/* Ensure saved version access */
		if (!formattedPubData.isDraft && !formattedPubData.hasVersionAccess) {
			throw new Error('Pub Not Found');
		}

		/* Ensure draft access */
		if (formattedPubData.isDraft && !formattedPubData.hasDraftAccess) {
			throw new Error('Pub Not Found');
		}

		const findActiveVersion = isDraftRoute
			? {}
			: Version.findOne({
				where: {
					id: formattedPubData.activeVersion.id,
				},
				attributes: { exclude: ['viewHash'] },
				raw: true,
			});
		return Promise.all([formattedPubData, findActiveVersion]);
	})
	.then(([formattedPubData, activeVersion])=> {
		const hasSections = !isDraftRoute && activeVersion && Array.isArray(activeVersion.content);
		const sectionId = initialData.locationData.params.sectionId;
		const validSectionId = hasSections && activeVersion.content.reduce((prev, curr)=> {
			if (!sectionId) { return true; }
			if (sectionId === curr.id) { return true; }
			return prev;
		}, false);
		if (hasSections && !validSectionId) {
			throw new Error('Pub Not Found');
		}

		/* Remove the content from the sections other than the rendered */
		/* section to save bytes on the transfer */
		const formattedActiveVersionData = !hasSections
			? activeVersion
			: {
				...activeVersion,
				content: activeVersion.content.map((item, index)=> {
					if (!sectionId && index === 0) { return item; }
					if (item.id === sectionId) { return item; }
					return { title: item.title, id: item.id };
				})
			};

		const outputPub = {
			...formattedPubData,
			activeVersion: formattedActiveVersionData,
			citationData: generateCitationHTML(formattedPubData, initialData.communityData),
		};

		if (!formattedPubData.isManager) {
			outputPub.draftViewHash = undefined;
			outputPub.draftEditHash = undefined;
		}

		return outputPub;
	});
};

export const findPage = (pageId, useIncludes, initialData)=> {
	const pageQuery = Page.findOne({
		where: { id: pageId }
	});
	const communityAdminQuery = CommunityAdmin.findOne({
		where: {
			userId: initialData.loginData.id,
			communityId: initialData.communityData.id,
		}
	});
	const pubsQuery = useIncludes && Pub.findAll({
		where: { communityId: initialData.communityData.id },
		include: [
			{
				model: Version,
				required: false,
				as: 'versions',
				attributes: ['id', 'isPublic', 'isCommunityAdminShared', 'createdAt']
			},
			{
				model: PubManager,
				as: 'managers',
				separate: true,
			},
			{
				model: PubAttribution,
				as: 'attributions',
				required: false,
				separate: true,
				include: [{ model: User, as: 'user', required: false, attributes: ['id', 'fullName', 'avatar', 'slug', 'initials', 'title'] }],
			},
			{
				model: VersionPermission,
				as: 'versionPermissions',
				required: false,
				separate: true,
			},
			{
				model: PubTag,
				as: 'pubTags',
				required: false,
				separate: true,
				include: [{
					model: Tag,
					as: 'tag',
				}],
			},
		]
	});
	return Promise.all([pageQuery, communityAdminQuery, pubsQuery])
	.then(([pageData, communityAdminData, pubsData])=> {
		const formattedPubsData = pubsData.map((pubData)=> {
			return formatAndAuthenticatePub(pubData.toJSON(), initialData.loginData, communityAdminData, { query: {} }, false);
		}).filter((formattedPub)=> {
			return formattedPub;
		});
		return {
			...pageData.toJSON(),
			pubs: formattedPubsData,
		};
	});
};


// TODO - this needs to be updated to not use Collaborator
// but it also needs a redesign.
export const getPubSearch = (query, initialData)=> {
	const searchTerms = [
		{
			$or: [
				{ title: { $ilike: `%${query.q}%` } },
				{ description: { $ilike: `%${query.q}%` } },
			]
		},
		{
			$or: [
				{ firstPublishedAt: { $ne: null } },
				{ draftPermissions: 'publicView' },
				{ draftPermissions: 'publicEdit' },
			]
		}
	];

	const includes = [
		{
			model: Collection,
			as: 'collections',
			where: { isPublic: true },
			attributes: ['id', 'isPublic'],
			through: { attributes: [] },
		},
		{
			model: User,
			as: 'collaborators',
			attributes: ['id', 'avatar', 'initials', 'fullName'],
			through: { attributes: ['isAuthor'] },
		},
		{
			required: false,
			model: Collaborator,
			as: 'emptyCollaborators',
			where: { userId: null },
			attributes: { exclude: ['createdAt', 'updatedAt'] },
		},
		{
			required: false,
			separate: true,
			model: Discussion,
			as: 'discussions',
			attributes: ['suggestions', 'pubId']
		},
	];
	if (initialData.communityData.id) {
		searchTerms.push({ communityId: initialData.communityData.id });
	}
	if (!initialData.communityData.id) {
		includes.push({
			model: Community,
			as: 'community',
			attributes: ['id', 'subdomain', 'domain', 'title', 'smallHeaderLogo', 'accentColor'],
		});
	}

	return Pub.findAll({
		where: {
			$and: searchTerms
		},
		attributes: {
			exclude: ['editHash', 'viewHash'],
		},
		limit: 10,
		include: includes
	})
	.then((results)=> {
		const output = results.map((pubObject)=> {
			const pub = pubObject.toJSON();
			return {
				...pub,
				discussionCount: pub.discussions ? pub.discussions.length : 0,
				suggestionCount: pub.discussions ? pub.discussions.reduce((prev, curr)=> {
					if (curr.suggestions) { return prev + 1; }
					return prev;
				}, 0) : 0,
				collaboratorCount: pub.collaborators.length + pub.emptyCollaborators.length,
				discussions: undefined,
				collaborators: [
					...pub.collaborators,
					...pub.emptyCollaborators.map((item)=> {
						return {
							id: item.id,
							initials: item.name[0],
							fullName: item.name,
							Collaborator: {
								id: item.id,
								isAuthor: item.isAuthor,
								permissions: item.permissions,
								order: item.order,
							}
						};
					})
				],
				emptyCollaborators: undefined,
			};
		});
		return output;
	});
};
