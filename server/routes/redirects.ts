import app from 'server/server';

const redirectHosts = {
	'www.pubpub.org': {
		'/iai': 'https://v3.pubpub.org/iai',
		'/help': 'https://help.pubpub.org',
	},
	'pubpub.ito.com': {
		'/pub/resisting-reduction': 'https://jods.mitpress.mit.edu/pub/resisting-reduction',
	},
	'notes.knowledgefutures.org': {
		'/pub/3jhmyfk5': 'https://help.pubpub.org/pub/3jhmyfk5',
		'/pub/jzwe5q1g': 'https://help.pubpub.org/pub/jzwe5q1g',
		'/pub/hqwzn8fh': 'https://help.pubpub.org/pub/hqwzn8fh',
		'/pub/75lx36sm': 'https://help.pubpub.org/pub/75lx36sm',
		'/pub/f66uz1v5': 'https://help.pubpub.org/pub/f66uz1v5',
		'/pub/wgzaxb48': 'https://help.pubpub.org/pub/wgzaxb48',
		'/pub/5huj3uo3': 'https://help.pubpub.org/pub/5huj3uo3',
		'/pub/a35zdl6z': 'https://help.pubpub.org/pub/a35zdl6z',
	},
	'bookbook.pubpub.org': {
		'/pub/oki': 'https://wip.mitpress.mit.edu/pub/oki',
		'/oki': 'https://wip.mitpress.mit.edu/oki',
	},
	'kfg.mit.edu': {
		'/': 'https://www.knowledgefutures.org',
		'*': 'https://notes.knowledgefutures.org$1',
	},
	'blog.pubpub.org': {
		'*': 'https://notes.knowledgefutures.org$1',
	},
	'commonplace.pubpub.org': {
		'/pub/y6zaxybl': 'https://notes.knowledgefutures.org/pub/y6zaxybl',
		'/pub/zmxeo3dv': 'https://notes.knowledgefutures.org/pub/zmxeo3dv',
		'/pub/ek9zpak0': 'https://notes.knowledgefutures.org/pub/ek9zpak0',
	},
	'baas.aas.org': {
		'/obituaries/*': 'https://aasjournals.github.io/aas-obits-mirror/$1.html',
		'/wp-content/uploads/*':
			'https://113qx216in8z1kdeyi404hgf-wpengine.netdna-ssl.com/wp-content/uploads/$1',
		'/community/astro2020-apc-white-papers':
			'https://aasjournals.github.io/aas-obits-mirror/astro2020-apc-index.html',
		'/community/astro2020-science-white-papers':
			'https://aasjournals.github.io/aas-obits-mirror/astro2020-science-index.html',
		'/community/final-report-of-the-2018-aas-task-force-on-diversity-and-inclusion-in-astronomy-graduate-education':
			'https://baas.aas.org/pub/2019i0101',
		'/community/gender-and-sexual-minorities-in-astronomy-and-planetary-science':
			'https://baas.aas.org/pub/2019i0206',
		'/community/logistics-is-a-key-enabler-of-sustainable-human-mars-missions':
			'https://baas.aas.org/pub/2019i0202',
		'/community-reports-listing': 'https://baas.aas.org/community-reports',
		'/community/ten-years-of-astronomy-scientific-and-cultural-impact':
			'https://baas.aas.org/pub/2019i0203',
		'/community/ten-years-of-dot-astronomy': 'https://baas.aas.org/pub/2019i0203',
		'/community/women-in-astronomy-in-a-post-gre-world': 'https://baas.aas.org/pub/2019i0204',
		'/meeting-abstracts-listing': 'https://baas.aas.org/abstracts',
		'/news/anniversaries-in-2019': 'https://baas.aas.org/pub/2019i0205',
		'/news/lifetimes-of-astronomical-papers': 'https://baas.aas.org/pub/2019i0207',
		'/news-listing': 'https://baas.aas.org/news',
		'/news/principles-of-editing': 'https://baas.aas.org/pub/2019i0201',
		'/obituaries-listing': 'https://baas.aas.org/obituaries',
	},
	'underlay.pubpub.org': {
		'/pub/future': 'https://notes.knowledgefutures.org/pub/future/',
	},
	'research.arcadiascience.com': {
		'/pub/publishing-round-one':
			'https://research.arcadiascience.com/pub/perspective-publishing-round-one',
		'/pub/publishing-round-one/release/1':
			'https://research.arcadiascience.com/pub/perspective-publishing-round-one/release/1',
	},
};

app.use((req, res, next) => {
	const hostValues = redirectHosts[req.hostname];
	if (hostValues) {
		const pathValue = hostValues[req.path];
		if (pathValue) {
			return res.redirect(pathValue);
		}
		const matchedPatternKey = Object.keys(hostValues).find((key) => {
			const reducedKey = key.replace('*', '');
			return key.indexOf('*') > -1 && req.path.indexOf(reducedKey) === 0;
		});
		if (matchedPatternKey) {
			const patternValue = hostValues[matchedPatternKey];
			const reducedKey = matchedPatternKey.replace('*', '');
			return res.redirect(patternValue.replace('$1', req.path.replace(reducedKey, '')));
		}
	}
	return next();
});
