import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ComposableMap, ZoomableGroup, Geographies, Geography } from 'react-simple-maps';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { Spinner } from '@blueprintjs/core';
import KeenAnalysis from 'keen-analysis';

require('./pubOptionsAnalytics.scss');

const propTypes = {
	locationData: PropTypes.object.isRequired,
	// communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	// setPubData: PropTypes.func.isRequired,
};

class PubOptionsAnalytics extends Component {
	constructor(props) {
		super(props);
		this.state = {
			mapData: undefined,
			visitsData: undefined,
			countryData: undefined,
			toolTipData: undefined,
		};
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleMouseLeave = this.handleMouseLeave.bind(this);
		this.keenClient = undefined;
	}

	componentDidMount() {
		fetch('https://assets.pubpub.org/_site/world-50m.json')
		.then((response)=> {
			if (!response.ok) {
				return response.json().then((err)=> { throw err; });
			}
			return response.json();
		})
		.then((data)=> {
			this.setState({ mapData: data });
		})
		.catch((err)=> {
			console.error('Error fetching map data', err);
		});

		this.keenClient = new KeenAnalysis({
			projectId: this.props.locationData.isPubPubProduction
				? '5b57a01ac9e77c0001eef181'
				: '5b5791b9c9e77c000175ca3b',
			readKey: this.props.locationData.isPubPubProduction
				? '5CF12741FA41DC030D092D2B6D247344B3C25183E9862A598D452F59B346BC5CD667E1C2B2DA03CFDE17339312D3880BC20C1051DAA146CAFF2ABA684FCE5B4B8985FF9C9EEC4406C3D851F0E81D67B33E65431FB39963378B9A8D8925B9C081'
				: 'E4C526BC021F960D2C84AB1521E8D1D3F0D1089292947A27880D43F83997554C5F95F34DD9E16A18B5F5FC0809A415AF4A2E74AAF9379B51520924BF2B692598FF80D751E8E6EC63F3B931432DF394799EFC0E0E6C100ED64C1E628873E9D16C',
		});

		const startDate = new Date(this.props.pubData.createdAt).toISOString() < '2018-10-15T00:00:00.000Z'
			? '2018-10-15T00:00:00.000Z'
			: this.props.pubData.createdAt;

		this.keenClient.query({
			analysis_type: 'count',
			event_collection: 'pageviews',
			cache: this.props.locationData.isPubPubProduction
				? { maxAge: 10 * 60 * 1000 } /* 10 minutes */
				: false,
			filters: [{
				property_name: 'pubpub.pubId',
				operator: 'eq',
				property_value: this.props.pubData.id,
			}],
			timeframe: {
				// TODO: We need to set the start date based on the earliest visible entry.
				start: startDate,
				end: new Date().toISOString()
			},
			interval: 'daily',
			group_by: 'geo.country',
		})
		.then((res)=> {
			const visitsData = res.result.map((item)=> {
				return {
					date: item.timeframe.start.substring(0, 10),
					visits: item.value.reduce((prev, curr)=> {
						return prev + curr.result;
					}, 0)
				};
			});
			const countryData = {};
			res.result.forEach((item)=> {
				item.value.forEach((itemValue)=> {
					const previousCountryValue = countryData[itemValue['geo.country']] || 0;
					countryData[itemValue['geo.country']] = previousCountryValue + itemValue.result;
				});
			});
			this.setState({
				visitsData: visitsData,
				countryData: countryData,
				totalVisits: visitsData.reduce((prev, curr)=> {
					return prev + curr.visits;
				}, 0),
			});
		})
		.catch((err)=> {
			console.error('Keen error: ', err);
		});
	}

	handleMouseMove(geography, evt) {
		const x = evt.clientX;
		const y = evt.clientY + window.pageYOffset;
		const countryVisits = this.state.countryData[geography.properties.name] || 0;
		const percentage = this.state.totalVisits ? (Math.round((countryVisits / this.state.totalVisits) * 10000) / 100) : 0;
		this.setState({
			toolTipData: {
				x: x,
				y: y,
				name: geography.properties.name,
				visits: countryVisits,
				percentage: percentage,
			}
		});
	}

	handleMouseLeave() {
		this.setState({ toolTipData: undefined });
	}

	render() {
		const toolTipData = this.state.toolTipData || {};
		const tooltipStyle = {
			top: toolTipData.y,
			left: toolTipData.x,
			position: 'fixed',
		};
		const hasPreAnalytics = new Date(this.props.pubData.createdAt).toISOString() < '2018-10-15T00:00:00.000Z';
		return (
			<div className="pub-options-analytics-component">
				<h1>Analytics</h1>

				{hasPreAnalytics &&
					<div className="pt-callout pt-intent-warning" style={{ marginBottom: '2em' }}>
						Pubs created before the launch of PubPub v5 display analytics back to October 15th.
					</div>
				}
				{this.state.toolTipData &&
					<div className="pt-elevation-2" style={tooltipStyle}>
						<div><b>Country: </b>{this.state.toolTipData.name}</div>
						<div><b>Visits: </b>{this.state.toolTipData.visits.toLocaleString()}</div>
						<div><b>Percent of Total Visits: </b>{this.state.toolTipData.percentage}%</div>
					</div>
				}

				<h2>Visits</h2>
				{!this.state.visitsData &&
					<div className="spinner-wrapper">
						<Spinner />
					</div>
				}
				{this.state.visitsData &&
					<ResponsiveContainer width="100%" height={150}>
						<AreaChart
							data={this.state.visitsData}
							margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
						>
							<defs>
								<linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#607D8B" stopOpacity={0.6} />
									<stop offset="95%" stopColor="#607D8B" stopOpacity={0} />
								</linearGradient>
							</defs>
							<XAxis dataKey="date" />
							<YAxis />
							<Tooltip
								content={(instance)=> {
									if (!instance.active) { return null; }
									const payload = instance.payload[0].payload;
									// console.log(payload);
									return (
										<div className="pt-elevation-2">
											<div><b>{payload.date}</b></div>
											<div>Visits: {payload.visits}</div>
											{/* <div>Unique Visits: {payload.unique}</div>
											<div>Average Time on Page: {payload.avgTime}s</div>
											*/}
										</div>
									);
								}}
							/>
							<Area type="monotone" dataKey="visits" stroke="#607D8B" fillOpacity={1} fill="url(#colorUv)" />
						</AreaChart>
					</ResponsiveContainer>
				}

				<h2>Visit Locations</h2>
				{(!this.state.mapData || !this.state.countryData) &&
					<div className="spinner-wrapper">
						<Spinner />
					</div>
				}
				{this.state.mapData && this.state.countryData &&
					<ComposableMap
						projectionConfig={{
							scale: 205,
							rotation: [-11, 0, 0],
						}}
						width={980}
						height={551}
						style={{
							width: '100%',
							height: 'auto',
						}}
					>
						<ZoomableGroup center={[0, 20]} disablePanning>
							<Geographies geography={this.state.mapData}>
								{(geographies, projection) => {
									return geographies.map((geography) => {
										const countryVisits = this.state.countryData[geography.properties.name] || 0;
										const visitRatio = this.state.totalVisits ? countryVisits / this.state.totalVisits : 0;
										const fill = `rgba(26, 76, 109, ${visitRatio ? visitRatio * 0.75 + 0.25 : 0.05})`;
										return (
											<Geography
												key={geography.id}
												geography={geography}
												projection={projection}
												onMouseMove={this.handleMouseMove}
												onMouseLeave={this.handleMouseLeave}
												style={{
													default: {
														fill: fill,
														stroke: '#607D8B',
														strokeWidth: 0.75,
														outline: 'none',
													},
													hover: {
														fill: '#607D8B',
														stroke: '#607D8B',
														strokeWidth: 0.75,
														outline: 'none',
													},
													pressed: {
														fill: fill,
														stroke: '#607D8B',
														strokeWidth: 0.75,
														outline: 'none',
													},
												}}
											/>
										);
									});
								}}
							</Geographies>
						</ZoomableGroup>
					</ComposableMap>
				}
			</div>
		);
	}
}

PubOptionsAnalytics.propTypes = propTypes;
export default PubOptionsAnalytics;
