import React from 'react';
import { CommunityPreview } from 'components';

require('./explore.scss');

type Props = {
	exploreData: any;
};

const Explore = (props: Props) => {
	const exploreData = props.exploreData;

	return (
		<div id="explore-container">
			<div className="container">
				<div className="row">
					<div className="col-12">
						<h1>Explore communities</h1>
						<div className="details">
							PubPub hosts over 3,000 communities, with more added every day! Anyone
							can <a href="/community/create">create</a> a free PubPub community at
							any time; all you need is an account and some very basic community
							details. Below are 40 PubPub communities that we think form a good
							snapshot of what you can create with PubPub's spaces and features. We
							hope they provide inspiration for your own spaces, designs, and
							workflows.
						</div>
					</div>

					{exploreData.activeCommunities
						.filter((item) => {
							return item;
						})
						.sort((foo, bar) => {
							if (foo.updatedAt < bar.updatedAt) {
								return 1;
							}
							if (foo.updatedAt > bar.updatedAt) {
								return -1;
							}
							if (foo.title > bar.title) {
								return 1;
							}
							if (foo.title < bar.title) {
								return -1;
							}
							return 0;
						})
						.map((item) => {
							return (
								<div className="col-4" key={`active-${item.id}`}>
									<CommunityPreview
										subdomain={item.subdomain}
										domain={item.domain}
										title={item.title}
										description={item.description}
										heroBackgroundImage={item.heroBackgroundImage}
										heroLogo={item.heroLogo}
										accentColor={item.accentColor}
										accentTextColor={item.accentTextColor}
									/>
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
};
export default Explore;
