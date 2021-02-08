/* eslint-disable no-console */
import Promise from 'bluebird';
import { Pub, Community } from 'server/models';
import { Op } from 'sequelize';
import fetch from 'node-fetch';
import { promptOkay } from './utils/prompt';

/** Usage: npm run tools pubCrawl -- --subdomain subdomain */
const {
	argv: { subdomain },
} = require('yargs');

console.log(subdomain);

const crawl = async (pub) => {
	const url = `https://dx.doi.org/${pub.doi}`;
	try {
		const response = await fetch(url);
		if (response.status === 404) {
			console.log(
				`DOI did not resolve: ${pub.title} • https://${pub.community.domain ||
					pub.community.subdomain}/pub/${pub.slug}`,
			);
		}
		return Promise.resolve(response);
	} catch (err) {
		return Promise.resolve(`FAILED: ${url} (${err.message})`);
	}
};

const main = async () => {
	const query = {
		attributes: ['doi', 'slug', 'title'],
		include: [{ model: Community, as: 'community', where: { subdomain } }],
		order: [['createdAt', 'ASC']],
		// limit: 500,
		// offset: 0,
		where: { doi: { [Op.ne]: null } },
	};
	try {
		const pubs = await Pub.findAll(query);
		await promptOkay(`Crawl ${pubs.length} pubs?`, {
			yesIsDefault: false,
			throwIfNo: true,
		});
		await Promise.map(pubs, crawl, { concurrency: 5 });
		console.log('crawl completed');
	} catch (err) {
		console.warn(err);
	}
};

main().finally(() => process.exit(0));
