import stripIndent from 'strip-indent';

import app from 'server/server';
import { getInitialData } from 'server/utils/initData';

app.get('/opensearch.xml', (req, res) => {
	return getInitialData(req)
		.then((initialData) => {
			const domain =
				initialData.communityData.domain ||
				`${initialData.communityData.subdomain || 'www'}.pubpub.org`;
			const outputXML = stripIndent(`
			<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
				<ShortName>${initialData.communityData.title}</ShortName>
				<Description>Search ${initialData.communityData.title}</Description>
				<InputEncoding>UTF-8</InputEncoding>
				<Image width="16" height="16" type="image/x-icon">${initialData.communityData.favicon}</Image>
				<Url type="text/html" method="get" template="https://${domain}/search?q={searchTerms}"/>
			</OpenSearchDescription>
		`);
			res.set('Content-Type', 'text/xml');
			return res.send(outputXML);
		})
		.catch((err) => {
			console.error(err);
			return res.status(200).json('Error producing OpenSearch XML');
		});
});
