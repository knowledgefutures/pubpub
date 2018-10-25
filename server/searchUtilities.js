import algoliasearch from 'algoliasearch';

const client = algoliasearch(process.env.ALGOLIA_ID, process.env.ALGOLIA_KEY);
const pubIndex = client.initIndex('pubs');
// const peopleIndex
// const communityIndex

