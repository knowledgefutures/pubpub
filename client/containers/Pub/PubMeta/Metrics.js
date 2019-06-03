import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ComposableMap, ZoomableGroup, Geographies, Geography } from 'react-simple-maps';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { Spinner, Tab, Tabs } from '@blueprintjs/core';
import KeenAnalysis from 'keen-analysis';
import { PageContext } from 'components/PageWrapper/PageWrapper';

require('./metrics.scss');

const propTypes = {
	// locationData: PropTypes.object.isRequired,
	// communityData: PropTypes.object.isRequired,
	pubData: PropTypes.object.isRequired,
	// loginData: PropTypes.object.isRequired,
	// setPubData: PropTypes.func.isRequired,
};

let keenClient;

const Metrics = (props) => {
	const [mapData, setMapData] = useState(undefined);
	const [visitsData, setVisitsData] = useState(undefined);
	const [countryData, setCountryData] = useState({});
	const [toolTipData, setToolTipData] = useState(undefined);
	const [totalVisits, setTotalVisits] = useState(undefined);
	const { locationData } = useContext(PageContext);
	useEffect(() => {
		fetch('https://assets.pubpub.org/_site/world-50m.json')
			.then((response) => {
				if (!response.ok) {
					return response.json().then((err) => {
						throw err;
					});
				}
				return response.json();
			})
			.then((data) => {
				setMapData(data);
			})
			.catch((err) => {
				console.error('Error fetching map data', err);
			});

		keenClient = new KeenAnalysis({
			projectId: locationData.isPubPubProduction
				? '5b57a01ac9e77c0001eef181'
				: '5b5791b9c9e77c000175ca3b',
			readKey: locationData.isPubPubProduction
				? '5CF12741FA41DC030D092D2B6D247344B3C25183E9862A598D452F59B346BC5CD667E1C2B2DA03CFDE17339312D3880BC20C1051DAA146CAFF2ABA684FCE5B4B8985FF9C9EEC4406C3D851F0E81D67B33E65431FB39963378B9A8D8925B9C081'
				: 'E4C526BC021F960D2C84AB1521E8D1D3F0D1089292947A27880D43F83997554C5F95F34DD9E16A18B5F5FC0809A415AF4A2E74AAF9379B51520924BF2B692598FF80D751E8E6EC63F3B931432DF394799EFC0E0E6C100ED64C1E628873E9D16C',
		});

		const startDate =
			new Date(props.pubData.createdAt).toISOString() < '2018-10-15T00:00:00.000Z'
				? '2018-10-15T00:00:00.000Z'
				: props.pubData.createdAt;

		keenClient
			.query({
				analysis_type: 'count',
				event_collection: 'pageviews',
				cache: locationData.isPubPubProduction
					? { maxAge: 10 * 60 * 1000 } /* 10 minutes */
					: false,
				filters: [
					{
						property_name: 'pubpub.pubId',
						operator: 'eq',
						property_value: props.pubData.id,
					},
				],
				timeframe: {
					// TODO: We need to set the start date based on the earliest visible entry.
					start: startDate,
					end: new Date().toISOString(),
				},
				interval: 'daily',
				group_by: 'geo.country',
			})
			.then((res) => {
				const newVisitsData = res.result.map((item) => {
					return {
						date: item.timeframe.start.substring(0, 10),
						visits: item.value.reduce((prev, curr) => {
							return prev + curr.result;
						}, 0),
					};
				});
				const newCountryData = {};
				res.result.forEach((item) => {
					item.value.forEach((itemValue) => {
						const previousCountryValue = countryData[itemValue['geo.country']] || 0;
						countryData[itemValue['geo.country']] =
							previousCountryValue + itemValue.result;
					});
				});
				setVisitsData(newVisitsData);
				setCountryData(newCountryData);
				setTotalVisits(
					newVisitsData.reduce((prev, curr) => {
						return prev + curr.visits;
					}, 0),
				);
			})
			.catch((err) => {
				console.error('Keen error: ', err);
			});
		return () => {};
	}, [countryData, locationData.isPubPubProduction, props.pubData.createdAt, props.pubData.id]);

	const handleMouseMove = (geography, evt) => {
		const x = evt.clientX;
		const y = evt.clientY + window.pageYOffset;
		const countryVisits = countryData[geography.properties.name] || 0;
		const percentage = totalVisits
			? Math.round((countryVisits / totalVisits) * 10000) / 100
			: 0;
		setToolTipData({
			x: x,
			y: y,
			name: geography.properties.name,
			visits: countryVisits,
			percentage: percentage,
		});
	};

	const handleMouseLeave = () => {
		setToolTipData(undefined);
	};

	const tooltipStyle = toolTipData
		? {
				top: toolTipData.y,
				left: toolTipData.x,
				position: 'fixed',
		  }
		: {};
	const hasPreAnalytics =
		new Date(props.pubData.createdAt).toISOString() < '2018-10-15T00:00:00.000Z';

	const visitsPanel = (
		<div className="visits">
			{!visitsData && (
				<div className="spinner-wrapper">
					<Spinner />
				</div>
			)}
			{visitsData && (
				<ResponsiveContainer width="100%" height={150}>
					<AreaChart
						data={visitsData}
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
							content={(instance) => {
								if (!instance.active) {
									return null;
								}
								const payload = instance.payload[0].payload;
								return (
									<div className="bp3-elevation-2">
										<div>
											<b>{payload.date}</b>
										</div>
										<div>Visits: {payload.visits}</div>
										{/* <div>Unique Visits: {payload.unique}</div>
								<div>Average Time on Page: {payload.avgTime}s</div>
								*/}
									</div>
								);
							}}
						/>
						<Area
							type="monotone"
							dataKey="visits"
							stroke="#607D8B"
							fillOpacity={1}
							fill="url(#colorUv)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			)}
		</div>
	);

	const locationsPanel = (
		<div className="locations">
			{(!mapData || !countryData) && (
				<div className="spinner-wrapper">
					<Spinner />
				</div>
			)}
			{mapData && countryData && (
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
						<Geographies geography={mapData}>
							{(geographies, projection) => {
								return geographies.map((geography) => {
									const countryVisits =
										countryData[geography.properties.name] || 0;
									const visitRatio = totalVisits
										? countryVisits / totalVisits
										: 0;
									const fill = `rgba(26, 76, 109, ${
										visitRatio ? visitRatio * 0.75 + 0.25 : 0.05
									})`;
									return (
										<Geography
											key={geography.id}
											geography={geography}
											projection={projection}
											onMouseMove={handleMouseMove}
											onMouseLeave={handleMouseLeave}
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
			)}
		</div>
	);

	return (
		<div className="pub-meta_metrics-component">
			{hasPreAnalytics && (
				<div className="bp3-callout bp3-intent-warning" style={{ marginBottom: '2em' }}>
					Pubs created before the launch of PubPub v5 display analytics back to October
					15th.
				</div>
			)}
			{toolTipData && (
				<div className="bp3-elevation-2" style={tooltipStyle}>
					<div>
						<b>Country: </b>
						{toolTipData.name}
					</div>
					<div>
						<b>Visits: </b>
						{toolTipData.visits.toLocaleString()}
					</div>
					<div>
						<b>Percent of Total Visits: </b>
						{toolTipData.percentage}%
					</div>
				</div>
			)}
			<Tabs id="pub-metrics">
				<Tab id="visits" title="Visits" panel={visitsPanel} />
				<Tab id="locations" title="Visit locations" panel={locationsPanel} />
			</Tabs>
		</div>
	);
};

Metrics.propTypes = propTypes;
export default Metrics;
