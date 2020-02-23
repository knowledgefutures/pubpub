import { remove as removeDiacritics } from 'diacritics';
import { setIsProd, isProd } from './isProd';

export { hydrateWrapper } from './hydrateWrapper';
export { apiFetch } from './apiFetch';

if (typeof window === 'undefined') {
	setIsProd(process.env.PUBPUB_PRODUCTION);
}

export const getFirebaseConfig = function() {
	return {
		apiKey: 'AIzaSyCVBq7I9ddJpHhs-DzVEEdM09-VqTVex1g',
		authDomain: 'pubpub-v6.firebaseapp.com',
		projectId: 'pubpub-v6',
		storageBucket: 'pubpub-v6.appspot.com',
		messagingSenderId: '503345633278',
		databaseURL: isProd()
			? 'https://pubpub-v6-prod.firebaseio.com'
			: 'https://pubpub-v6-dev.firebaseio.com',
	};
};

export const getResizedUrl = function(url, type, dimensions) {
	if (!url || url.indexOf('https://assets.pubpub.org/') === -1) {
		return url;
	}
	const extension = url
		.split('.')
		.pop()
		.toLowerCase();
	const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
	if (validExtensions.indexOf(extension) === -1) {
		return url;
	}

	const prefix = type ? `${type}/` : '';
	const filepath = url.replace('https://assets.pubpub.org/', '');
	return `https://resize.pubpub.org/${prefix}${dimensions}/${filepath}`;
};

export const defaultFooterLinks = [
	{ id: 'rss', title: 'RSS', href: '/rss.xml' },
	{ id: 'legal', title: 'Legal', href: '/legal' },
];
export const populateSocialItems = (communityData) => {
	return [
		{
			id: 'si-0',
			icon: 'globe',
			title: 'Website',
			value: communityData.website,
			url: communityData.website,
		},
		{
			id: 'si-1',
			icon: 'twitter',
			title: 'Twitter',
			value: communityData.twitter,
			url: `https://twitter.com/${communityData.twitter}`,
		},
		{
			id: 'si-2',
			icon: 'facebook',
			title: 'Facebook',
			value: communityData.facebook,
			url: `https://facebook.com/${communityData.facebook}`,
		},
		{
			id: 'si-3',
			icon: 'envelope',
			title: 'Contact',
			value: communityData.email,
			url: `mailto:${communityData.email}`,
		},
	].filter((item) => {
		return item.value;
	});
};

export const populateNavigationIds = function(collections, navigation) {
	const collectionsObject = {};
	collections.forEach((item) => {
		collectionsObject[item.id] = item;
	});
	return navigation
		.map((item) => {
			if (item.children) {
				return {
					...item,
					children: item.children
						.map((child) => {
							return typeof child === 'string' ? collectionsObject[child] : child;
						})
						.filter((child) => {
							return !!child;
						}),
				};
			}
			if (typeof item.href === 'string') {
				return item;
			}
			return collectionsObject[item];
		})
		.filter((item) => {
			if (!item) {
				return false;
			}
			if (item.children && !item.children.length) {
				return false;
			}
			return true;
		});
};

export function generateHash(length) {
	const tokenLength = length || 32;
	const possible = 'abcdefghijklmnopqrstuvwxyz0123456789';

	let hash = '';
	for (let index = 0; index < tokenLength; index += 1) {
		hash += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return hash;
}

export const slugifyString = (input) => {
	if (typeof input !== 'string') {
		console.error('input is not a valid string');
		return '';
	}

	return removeDiacritics(input)
		.replace(/ /g, '-')
		.replace(/[^a-zA-Z0-9-]/gi, '')
		.toLowerCase();
};

export function getDefaultLayout() {
	// if (isPage) {
	// 	return [
	// 		{
	// 			id: 'kruw36cv',
	// 			type: 'text',
	// 			content: {
	// 				text: undefined,
	// 			},
	// 		}
	// 	];
	// }
	return [
		{
			id: '0kyj32ay',
			type: 'pubs',
			content: {
				title: '',
				size: 'large',
				limit: 1,
				pubIds: [],
			},
		},
		{
			id: 'gruw36cv',
			type: 'pubs',
			content: {
				title: '',
				size: 'medium',
				limit: 0,
				pubIds: [],
			},
		},
		// {
		// 	type: pubs
		// 	content: {
		// 		title:
		// 		pubPreviewType:
		// 		limit:
		// 		pubIds:
		// 		draftsOnly:
		// 		collectionId:
		// 	}
		// }
	];
}

export function renderLatexString(value, isBlock, callback) {
	fetch('/api/editor/latex-render', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			value: value,
			isBlock: isBlock,
		}),
		credentials: 'include',
	})
		.then((response) => {
			if (!response.ok) {
				return response.json().then((err) => {
					throw err;
				});
			}
			return response.json();
		})
		.then((result) => {
			callback(result);
		})
		.catch((error) => {
			callback(error);
		});
}

export function checkForAsset(url) {
	let checkCount = 0;
	const maxCheckCount = 10;
	const checkInterval = 1000; /* This will check for 10 seconds and then fail */
	return new Promise((resolve, reject) => {
		const checkUrl = () => {
			fetch(url, {
				method: 'HEAD',
			}).then((response) => {
				if (!response.ok) {
					if (checkCount < maxCheckCount) {
						checkCount += 1;
						return setTimeout(checkUrl, checkInterval);
					}
					return reject();
				}
				return resolve();
			});
		};
		checkUrl();
	});
}

export function s3Upload(file, progressEvent, finishEvent, index) {
	function beginUpload() {
		const folderName = isProd() ? generateHash(8) : '_testing';

		const extension = file.name !== undefined ? file.name.split('.').pop() : 'jpg';

		// const filename = folderName + '/' + new Date().getTime() + '.' + extension;
		// const filename = folderName + '/' + (Math.floor(Math.random() * 8)) + new Date().getTime() + '.' + extension;
		const filename = `${folderName}/${Math.floor(
			Math.random() * 8,
		)}${new Date().getTime()}.${extension}`;
		const fileType = file.type !== undefined ? file.type : 'image/jpeg';
		const formData = new FormData();

		formData.append('key', filename);
		formData.append('AWSAccessKeyId', 'AKIAIUXFM6YJQGAV7GRQ');
		formData.append('acl', 'public-read');
		formData.append('policy', JSON.parse(this.responseText).policy);
		formData.append('signature', JSON.parse(this.responseText).signature);
		formData.append('Content-Type', fileType);
		formData.append('success_action_status', '200');
		formData.append('file', file);
		const sendFile = new XMLHttpRequest();
		sendFile.upload.addEventListener(
			'progress',
			(evt) => {
				progressEvent(evt, index);
			},
			false,
		);
		sendFile.upload.addEventListener(
			'load',
			(evt) => {
				checkForAsset(
					`https://s3-external-1.amazonaws.com/assets.pubpub.org/${filename}`,
				).then(() => {
					finishEvent(evt, index, file.type, filename, file.name);
				});
			},
			false,
		);
		sendFile.open('POST', 'https://s3-external-1.amazonaws.com/assets.pubpub.org', true);
		sendFile.send(formData);
	}

	const getPolicy = new XMLHttpRequest();
	getPolicy.addEventListener('load', beginUpload);
	getPolicy.open('GET', `/api/uploadPolicy?contentType=${file.type}`);
	getPolicy.send();
}

export function getRandomColor(loginId) {
	const colors = [
		'244,67,54',
		'63,81,181',
		'0,150,136',
		'255,152,0',
		'96,125,139',
		'233,30,99',
		'3,169,244',
		'156,39,176',
		'139,195,74',
		'103,58,183',
		'121,85,72',
		'33,150,243',
		'255,193,7',
		'0,188,212',
		'76,175,80',
		'205,220,57',
		'255,87,34',
	];
	if (!loginId) {
		return colors[0];
	}
	return colors[loginId.charCodeAt(loginId.length - 1) % colors.length];
}

export function generatePubBackground(pubTitle) {
	const gradients = [
		'linear-gradient(135deg, #cb2d3e, #ef973a)',
		'linear-gradient(-45deg, #00bf8f, #001510)',
		'linear-gradient(135deg, #2c3e50, #4ca1af)',
		'linear-gradient(-45deg, #ad5389, #3c1053)',
		'linear-gradient(135deg, #000046, #1cb5e0)',
		// 'linear-gradient(to right, rgba(116, 235, 213, 1), rgba(172, 182, 229, 1))',
		// 'linear-gradient(to right, rgba(225, 238, 195, 1), rgba(240, 80, 83, 1))',
		// 'linear-gradient(to right, rgba(34, 193, 195, 1), rgba(253, 187, 45, 1))',
		// 'linear-gradient(to right, rgba(217, 167, 199, 1), rgba(255, 252, 220, 1))',
		// 'linear-gradient(to right, rgba(201, 214, 255, 1), rgba(226, 226, 226, 1))'
	];

	if (!pubTitle) {
		return gradients[0];
	}
	return gradients[pubTitle.charCodeAt(pubTitle.length - 1) % 5];
}

export function generatePageBackground(pageTitle) {
	const gradients = ['#b33939', '#cd6133', '#474787', '#227093', '#218c74'];

	if (!pageTitle) {
		return gradients[0];
	}
	return gradients[pageTitle.charCodeAt(pageTitle.length - 1) % 5];
}

export function generateRenderLists(layout, pubs) {
	/* Sort pubs by activeBranch date */
	const allPubs = pubs.sort((foo, bar) => {
		const fooDate = foo.activeBranch.firstKeyAt || foo.createdAt;
		const barDate = bar.activeBranch.firstKeyAt || bar.createdAt;
		if (fooDate < barDate) {
			return 1;
		}
		if (fooDate > barDate) {
			return -1;
		}
		return 0;
	});

	/* nonSpecifiedPubs is used to keep track of which pubs should flow */
	/* when looking to fill a slot that has not been specifically */
	/* assigned to a given pub */
	let nonSpecifiedPubs = [...allPubs];

	/* Iterate over each block and remove specified pubs from the */
	/* list of nonSpecifiedPubs. */
	layout.forEach((block) => {
		if (block.type === 'pubs') {
			const specifiedPubs = block.content.pubIds;
			nonSpecifiedPubs = nonSpecifiedPubs.filter((pub) => {
				return specifiedPubs.indexOf(pub.id) === -1;
			});
		}
	});

	/* pubRenderLists holds the list of pubs to be rendered in each block */
	const pubRenderLists = {};

	/* Iterate over each block and generate the renderList for that block */
	layout.forEach((block, index) => {
		if (block.type === 'pubs') {
			const allPubIds = {};
			pubs.forEach((curr) => {
				allPubIds[curr.id] = curr;
			});
			const collectionIds = block.content.collectionIds || [];
			// console.log(collectionIds);
			const availablePubs = nonSpecifiedPubs
				.filter((pub) => {
					if (!collectionIds.length) {
						return true;
					}
					return pub.collectionPubs.reduce((prev, curr) => {
						// if (curr.collectionId === block.content.collectionId) { return true; }
						if (collectionIds.indexOf(curr.collectionId) > -1) {
							return true;
						}
						return prev;
					}, false);
				})
				.sort((foo, bar) => {
					const fooRank =
						(foo.collectionPubs &&
							foo.collectionPubs[0] &&
							foo.collectionPubs[0].rank) ||
						'';
					const barRank =
						(bar.collectionPubs &&
							bar.collectionPubs[0] &&
							bar.collectionPubs[0].rank) ||
						'';

					if (fooRank < barRank) {
						return -1;
					}
					if (fooRank > barRank) {
						return 1;
					}
					if (foo.createdAt > bar.createdAt) {
						return -1;
					}
					if (foo.createdAt < bar.createdAt) {
						return 1;
					}
					return 0;
				});

			/* First add the specified pubs for a given block to the renderList */
			const renderList = block.content.pubIds.map((id) => {
				return allPubIds[id];
			});

			/* While below the set limit of max available pubs */
			/* keep adding pubs to the renderList */
			const maxAvailableList = availablePubs.length + renderList.length;
			const limit = Math.min(maxAvailableList, block.content.limit || maxAvailableList);
			for (let pubIndex = renderList.length; pubIndex < limit; pubIndex += 1) {
				renderList.push(availablePubs[0]);
				nonSpecifiedPubs = nonSpecifiedPubs.filter((pub) => {
					return pub.id !== availablePubs[0].id;
				});
				availablePubs.splice(0, 1);
			}

			/* Filter renderList to remove any undefined (due to specified pubs not in the collection) */
			/* or non-collection pubs. */
			pubRenderLists[index] = renderList.filter((pub) => {
				return pub;
			});
		}
	});
	return pubRenderLists;
}

export const getIframeSrc = (val) => {
	const re = /<iframe.*?src="(.*?)"/;
	const getSrc = val.indexOf('<iframe') > -1 && val.match(re) && val.match(re)[1];
	return getSrc || null;
};

export const getEmbedType = (input) => {
	const urls = {
		youtube: ['https://www.youtube.com', 'https://youtu.be'],
		codepen: ['https://codepen.io'],
		vimeo: ['https://vimeo.com', 'https://player.vimeo.com'],
		soundcloud: ['https://soundcloud.com'],
	};

	return Object.keys(urls).reduce((prev, curr) => {
		const currUrls = urls[curr];
		const isMatch = currUrls.reduce((prevMatch, currUrl) => {
			if (input.indexOf(currUrl) === 0) {
				return true;
			}
			return prevMatch;
		}, false);
		if (isMatch) {
			return curr;
		}
		return prev;
	}, null);
};
