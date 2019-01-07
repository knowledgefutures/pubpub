import React from 'react';
import Raven from 'raven-js';
import { hydrate } from 'react-dom';
import { FocusStyleManager } from '@blueprintjs/core';
import KeenTracking from 'keen-tracking';
import { remove as removeDiacritics } from 'diacritics';

let isPubPubProduction = false;
export const hydrateWrapper = (Component)=> {
	if (typeof window !== 'undefined' && window.location.origin !== 'http://localhost:9001') {
		FocusStyleManager.onlyShowFocusOnTabs();

		/* Remove any leftover service workers from last PubPub instance */
		if (window.navigator && navigator.serviceWorker) {
			navigator.serviceWorker.getRegistrations()
			.then((registrations)=> {
				registrations.forEach((registration)=> {
					registration.unregister();
				});
			});
		}

		const initialData = JSON.parse(document.getElementById('initial-data').getAttribute('data-json'));
		isPubPubProduction = initialData.locationData.isPubPubProduction;

		const isDev = window.location.origin.indexOf('localhost:') > -1;
		if (!isDev) {
			Raven.config('https://b4764efd07c240488d390c8343193208@sentry.io/197897').install();
			Raven.setUserContext({ username: initialData.loginData.slug });

			/* Keen Code */
			const keenEnvironment = isPubPubProduction
				? {
					projectId: '5b57a01ac9e77c0001eef181',
					writeKey: 'BA7C339A2A000ADC20572BBE37F49872DD8AB8EECBAF03E23AB8EDEF47E56FE9D1A54F63A7FC9548B06D7FF9AA057141E029369E637317B1E276CCE8206745A8D96CAFFFF2D6C4DB15E9E2D5C410426821E8379D0760A482ECF37C2F3868881C',
				}
				: {
					projectId: '5b5791b9c9e77c000175ca3b',
					writeKey: '44F36099BAA3DF17892D232C2D9A807E817FCA0D99461DBDCA05CB97E760D57409145F6E2045B616ED3BD16C3B4A75A467240F23CE78E09BB7515603C3DFD2061F430B27CDA4059F059EF58702514CDE5A09CD5134E6530CFAD8589D5341D185',
				};
			const client = new KeenTracking(keenEnvironment);

			const customEventData = {};
			if (initialData.communityData) {
				customEventData.communityId = initialData.communityData.id;
			}
			if (initialData.collectionData) {
				customEventData.pageId = initialData.collectionData.id;
			}
			if (initialData.pubData) {
				customEventData.pubId = initialData.pubData.id;
				customEventData.versionId = initialData.pubData.isDraft
					? 'draft'
					: initialData.pubData.activeVersion.id;
			}
			if (initialData.loginData.id) {
				customEventData.userId = initialData.loginData.id;
			}
			client.extendEvents({ pubpub: customEventData });
			client.initAutoTracking({
				recordPageViews: true,
				// recordPageViewsOnExit: true,
				recordClicks: false,
				// TODO: recordClicks being true breaks functionality on file input overlays (e.g. pub header image upload)
			});
		}

		hydrate(<Component {...initialData} />, document.getElementById('root'));
	}
};

export const apiFetch = function(path, opts) {
	return fetch(path, {
		...opts,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		credentials: 'include',
	})
	.then((response)=> {
		if (!response.ok) {
			return response.json().then((err)=> { throw err; });
		}
		return response.json();
	});
};

export const getFirebaseConfig = function() {
	// TODO: Remove this once we don't need dev.pubpub.org to point to v4-dev firebase
	if (typeof window === 'undefined'
		|| window.location.origin.indexOf('pubpub-v4-dev.herokuapp.com') > -1
	) {
		return {
			apiKey: 'AIzaSyBNlAp1EW5zhiPS8HWwXwZ8WMs-EdkMmKI',
			authDomain: 'pubpub-v4-dev-60334.firebaseapp.com',
			databaseURL: 'https://pubpub-v4-dev-60334.firebaseio.com',
			projectId: 'pubpub-v4-dev-60334',
			storageBucket: 'pubpub-v4-dev-60334.appspot.com',
			messagingSenderId: '410839613714'
		};
	}

	return {
		apiKey: 'AIzaSyBSzFrgIh2MQdWXwjVRGFnC30qv4uYZn08',
		authDomain: 'pubpub-v5.firebaseapp.com',
		projectId: 'pubpub-v5',
		storageBucket: 'pubpub-v5.appspot.com',
		messagingSenderId: '865496864907',
		databaseURL: isPubPubProduction
			? 'https://pubpub-v5-production.firebaseio.com'
			: 'https://pubpub-v5-development.firebaseio.com',
	};
};

export const getResizedUrl = function(url, type, dimensions) {
	if (!url || url.indexOf('https://assets.pubpub.org/') === -1) { return url; }
	const extension = url.split('.').pop().toLowerCase();
	const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
	if (validExtensions.indexOf(extension) === -1) { return url; }

	const prefix = type ? `${type}/` : '';
	const filepath = url.replace('https://assets.pubpub.org/', '');
	return `https://resize.pubpub.org/${prefix}${dimensions}/${filepath}`;
};

export const nestDiscussionsToThreads = function(discussions) {
	const maxThreadNumber = discussions.reduce((prev, curr)=> {
		if (curr.threadNumber > prev) { return curr.threadNumber; }
		return prev;
	}, 0);

	const tempThreads = new Array(maxThreadNumber).fill([]);
	discussions.forEach((item)=> {
		tempThreads[item.threadNumber - 1] = [...tempThreads[item.threadNumber - 1], item];
	});

	return tempThreads.filter((thread)=> {
		return thread.length;
	}).map((thread)=> {
		return thread.sort((foo, bar)=> {
			if (foo.createdAt > bar.createdAt) { return 1; }
			if (foo.createdAt < bar.createdAt) { return -1; }
			return 0;
		});
	});
};

export const populateNavigationIds = function(collections, navigation) {
	const collectionsObject = {};
	collections.forEach((item)=> {
		collectionsObject[item.id] = item;
	});
	return navigation.map((item)=> {
		if (item.children) {
			return {
				...item,
				children: item.children.map((child)=> {
					return collectionsObject[child];
				}).filter((child)=> {
					return !!child;
				})
			};
		}
		return collectionsObject[item];
	}).filter((item)=> {
		if (!item) { return false; }
		if (item.children && !item.children.length) { return false; }
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

export const slugifyString = (input)=> {
	if (typeof input !== 'string') {
		console.error('input is not a valid string');
		return '';
	}

	return removeDiacritics(input).replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/gi, '').toLowerCase();
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
				pubIds: []
			}
		},
		{
			id: 'gruw36cv',
			type: 'pubs',
			content: {
				title: '',
				size: 'medium',
				limit: 0,
				pubIds: []
			}
		},
		// {
		// 	type: pubs
		// 	content: {
		// 		title:
		// 		pubPreviewType:
		// 		limit:
		// 		pubIds:
		// 		draftsOnly:
		// 		tagId:
		// 	}
		// }
	];
}

export function formatCitationString(item, callback) {
	fetch('/api/editor/citation-format', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			input: item
		}),
		credentials: 'include',
	})
	.then((response)=> {
		if (!response.ok) {
			return response.json().then((err)=> { throw err; });
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
export function renderLatexString(value, isBlock, callback) {
	fetch('/api/editor/latex-render', {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			value: value,
			isBlock: isBlock,
		}),
		credentials: 'include',
	})
	.then((response)=> {
		if (!response.ok) {
			return response.json().then((err)=> { throw err; });
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
	return new Promise((resolve, reject)=> {
		const checkUrl = ()=> {
			fetch(url, {
				method: 'HEAD',
			})
			.then((response)=> {
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
		const folderName = isPubPubProduction
			? generateHash(8)
			: '_testing';

		const extension = file.name !== undefined ? file.name.split('.').pop() : 'jpg';

		// const filename = folderName + '/' + new Date().getTime() + '.' + extension;
		// const filename = folderName + '/' + (Math.floor(Math.random() * 8)) + new Date().getTime() + '.' + extension;
		const filename = `${folderName}/${Math.floor(Math.random() * 8)}${new Date().getTime()}.${extension}`;
		const fileType = file.type !== undefined ? file.type : 'image/jpeg';
		const formData = new FormData();

		formData.append('key', filename);
		formData.append('AWSAccessKeyId', 'AKIAJQ5MNLCTIMY2ZF7Q');
		formData.append('acl', 'public-read');
		formData.append('policy', JSON.parse(this.responseText).policy);
		formData.append('signature', JSON.parse(this.responseText).signature);
		formData.append('Content-Type', fileType);
		formData.append('success_action_status', '200');
		formData.append('file', file);
		const sendFile = new XMLHttpRequest();
		sendFile.upload.addEventListener('progress', (evt)=>{
			progressEvent(evt, index);
		}, false);
		sendFile.upload.addEventListener('load', (evt)=>{
			checkForAsset(`https://s3-external-1.amazonaws.com/assets.pubpub.org/${filename}`)
			.then(()=> {
				finishEvent(evt, index, file.type, filename, file.name);
			});
		}, false);
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
	if (!loginId) { return colors[0]; }
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

	if (!pubTitle) { return gradients[0]; }
	return gradients[pubTitle.charCodeAt(pubTitle.length - 1) % 5];
}

export function generatePageBackground(pageTitle) {
	const gradients = [
		'#b33939',
		'#cd6133',
		'#474787',
		'#227093',
		'#218c74',
	];

	if (!pageTitle) { return gradients[0]; }
	return gradients[pageTitle.charCodeAt(pageTitle.length - 1) % 5];
}

export function generateRenderLists(layout, pubs) {
	/* Sort pubs by activeVersion date - or date of pub */
	/* creation when there are no saved versions */
	const allPubs = pubs.sort((foo, bar)=> {
		const fooDate = foo.activeVersion.createdAt || foo.createdAt;
		const barDate = bar.activeVersion.createdAt || bar.createdAt;
		if (fooDate < barDate) { return 1; }
		if (fooDate > barDate) { return -1; }
		return 0;
	});

	/* nonSpecifiedPubs is used to keep track of which pubs should flow */
	/* when looking to fill a slot that has not been specifically */
	/* assigned to a given pub */
	let nonSpecifiedPubs = [...allPubs];

	/* Iterate over each block and remove specified pubs from the */
	/* list of nonSpecifiedPubs. */
	layout.forEach((block)=> {
		if (block.type === 'pubs') {
			const specifiedPubs = block.content.pubIds;
			nonSpecifiedPubs = nonSpecifiedPubs.filter((pub)=> {
				return specifiedPubs.indexOf(pub.id) === -1;
			});
		}
	});

	/* pubRenderLists holds the list of pubs to be rendered in each block */
	const pubRenderLists = {};

	/* Iterate over each block and generate the renderList for that block */
	layout.forEach((block, index)=> {
		if (block.type === 'pubs') {
			const allPubIds = {};
			pubs.forEach((curr)=> {
				allPubIds[curr.id] = curr;
			});
			const tagIds = block.content.tagIds || [];
			// console.log(tagIds);
			const availablePubs = nonSpecifiedPubs.filter((pub)=> {
				if (!tagIds.length) { return true; }
				return pub.pubTags.reduce((prev, curr)=> {
					// if (curr.tagId === block.content.tagId) { return true; }
					if (tagIds.indexOf(curr.tagId) > -1) { return true; }
					return prev;
				}, false);
			});

			/* First add the specified pubs for a given block to the renderList */
			const renderList = block.content.pubIds.map((id)=> {
				return allPubIds[id];
			});

			/* While below the set limit of max available pubs */
			/* keep adding pubs to the renderList */
			const maxAvailableList = availablePubs.length + renderList.length;
			const limit = Math.min(maxAvailableList, block.content.limit || maxAvailableList);
			for (let pubIndex = renderList.length; pubIndex < limit; pubIndex += 1) {
				renderList.push(availablePubs[0]);
				nonSpecifiedPubs = nonSpecifiedPubs.filter((pub)=> {
					return pub.id !== availablePubs[0].id;
				});
				availablePubs.splice(0, 1);
			}

			/* Filter renderList to remove any undefined (due to specified pubs not in the tag) */
			/* or non-tag pubs. */
			pubRenderLists[index] = renderList.filter((pub)=> {
				return pub;
			});
		}
	});
	return pubRenderLists;
}

export const getIframeSrc = (val)=> {
	const re = /(?<=src=").*?(?=["])/;
	const getSrc = val.indexOf('<iframe') > -1 && val.match(re) && val.match(re)[0];
	return getSrc || null;
};

export const getEmbedType = (input)=> {
	const urls = {
		youtube: [
			'https://www.youtube.com',
			'https://youtu.be'
		],
		codepen: [
			'https://codepen.io',
		],
		vimeo: [
			'https://vimeo.com',
			'https://player.vimeo.com',
		],
		soundcloud: [
			'https://soundcloud.com',
		],
	};

	return Object.keys(urls).reduce((prev, curr)=> {
		const currUrls = urls[curr];
		const isMatch = currUrls.reduce((prevMatch, currUrl)=> {
			if (input.indexOf(currUrl) === 0) { return true; }
			return prevMatch;
		}, false);
		if (isMatch) { return curr; }
		return prev;
	}, null);
};
