import React, { Component } from 'react';
import PropTypes from 'prop-types';
import algoliasearch from 'algoliasearch';
import { NonIdealState } from '@blueprintjs/core';
import PubPreview from 'components/PubPreview/PubPreview';
import PageWrapper from 'components/PageWrapper/PageWrapper';
import { hydrateWrapper } from 'utilities';

require('./search.scss');

const propTypes = {
	communityData: PropTypes.object.isRequired,
	loginData: PropTypes.object.isRequired,
	locationData: PropTypes.object.isRequired,
	searchData: PropTypes.object.isRequired,
};

class Search extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchQuery: props.locationData.query.q || '',
			searchResults: undefined,
		};
		this.handleSearchChange = this.handleSearchChange.bind(this);
		this.handleSearchSubmit = this.handleSearchSubmit.bind(this);

		const client = algoliasearch(props.searchData.searchId, props.searchData.searchKey);
		this.pubIndex = client.initIndex('pubs');
	}

	handleSearchChange(evt) {
		this.setState({ searchQuery: evt.target.value });
		this.pubIndex.search(evt.target.value).then((results)=>{
			this.setState({ searchResults: results });
		});
	}

	handleSearchSubmit(evt) {
		evt.preventDefault();

		// window.location.href = `/search?q=${this.state.searchQuery}`;
	}

	render() {
		// const searchData = this.props.searchData;
		return (
			<div id="search-container">
				<PageWrapper
					loginData={this.props.loginData}
					communityData={this.props.communityData}
					locationData={this.props.locationData}
					hideNav={this.props.locationData.isBasePubPub}
					hideFooter={true}
				>
					<div className="container narrow">
						<div className="row">
							<div className="col-12">
								<form onSubmit={this.handleSearchSubmit}>
									<input
										placeholder="Search for pubs..."
										value={this.state.searchQuery}
										onChange={this.handleSearchChange}
										className="pt-input pt-large pt-fill"
									/>
								</form>
							</div>
						</div>

						<div className="row">
							<div className="col-12">
								{JSON.stringify(this.state.searchResults, null, 2)}
								{/*!searchData.length && this.props.locationData.query.q &&
									<NonIdealState
										title="No Results"
										visual="pt-icon-search"
									/>
								}
								{!!searchData.length &&
									<div>
										{searchData.map((pub)=> {
											return (
												<div className="preview-wrapper" key={`result-${pub.id}`}>
													<PubPreview
														pubData={pub}
														size="medium"
													/>
												</div>
											);
										})}
									</div>
								*/}
							</div>
						</div>
					</div>
				</PageWrapper>
			</div>
		);
	}
}

Search.propTypes = propTypes;
export default Search;

hydrateWrapper(Search);
