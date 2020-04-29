// import { Sequelize } from 'sequelize';
// import { sequelize, Pub } from '../../server/models';
import { Pub } from '../../server/models';

export default async () => {
	// await sequelize.queryInterface.changeColumn('Pubs', 'headerStyle', {
	// 	type: Sequelize.ENUM('white-blocks', 'black-blocks', 'dark', 'light'),
	// });
	// await sequelize.queryInterface.removeColumn('Pubs', 'headerBackgroundType');
	const pubs = await Pub.findAll({ attributes: ['id', 'headerStyle', 'headerBackgroundImage'] });
	return Promise.all(
		pubs.map((pub) => {
			const hasHeaderImage = !!pub.headerBackgroundImage;
			const hasBlocksStyle =
				pub.headerStyle === 'white-blocks' || pub.headerStyle === 'black-blocks';
			// Formerly, the existence of a background image implied the addition of a "dim" style to
			// the header, effectively applying a dark tint. That is no longer done implicitly, so we
			// migrate those pubs to the 'dark' header background color. If there's no background image,
			// we default to the 'light' header that mimics the current vanilla pub style, with black
			// text and an off-white background.
			const headerBackgroundColor = hasHeaderImage && !hasBlocksStyle ? 'dark' : 'light';
			// Keep any existing header styles, and pick 'light' or 'dark' otherwise to match with
			// existing background images.
			const headerStyle = hasBlocksStyle
				? pub.headerStyle
				: hasHeaderImage
				? 'light'
				: 'dark';
			return pub.update({
				headerBackgroundColor: headerBackgroundColor,
				headerStyle: headerStyle,
			});
		}),
	);
};
