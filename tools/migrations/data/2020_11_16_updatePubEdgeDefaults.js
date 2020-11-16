import { Pub } from 'server/models';

const main = async () => {
	console.log('Updating all Pubs to pubEdgeListingDefaultsToCarousel=false.');

	try {
		await Pub.update(
			{ pubEdgeListingDefaultsToCarousel: false },
			{
				where: {},
			},
		);
	} catch (err) {
		console.log('Error with data migration:');
		console.log(err);
		return;
	}

	console.log('Done!');
};

main().finally(() => process.exit(0));
