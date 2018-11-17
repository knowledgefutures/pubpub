import app from '../server';

const tokenAuth = process.env.MATOMO_TOKEN_AUTH;

app.get('/api/analytics', (req, res)=> {
	const queryString = `
		module=API
		&method=API.getBulkRequest
		&idSite=1
		&token_auth=${tokenAuth}
		&format=json
		&date=2018-06-14,2018-07-15
		&urls[0]=${encodeURIComponent('method=VisitsSummary.get&period=day')}
		&urls[1]=${encodeURIComponent('method=UserCountry.getCountry&period=range')}
	`.replace(/\s/g, '');
	// &urls[2]=${encodeURIComponent('method=CustomDimensions.getCustomDimension&idDimension=1&period=range')}
	// &segment=browserCode==FF
	// &segment=dimension1==7808da6b-94d1-436d-ad79-2e036a8e4428

	return fetch('https://pubpub.innocraft.cloud', {
		method: 'POST',
		body: queryString,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
	})
	.then((response)=> {
		if (!response.ok) {
			return response.json().then((err)=> { throw err; });
		}
		return response.json();
	})
	.then((data)=> {
		return res.status(201).json(data);
	})
	.catch((err)=> {
		console.error('Error getting Analytics data', err);
		return res.status(500).json(err);
	});
});
