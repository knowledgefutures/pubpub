import { Pub } from 'server/models';

module.exports = async () => {
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
};
