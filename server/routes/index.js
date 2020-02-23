require('./redirects'); // Redirect needed v3 routes;

require('./pub'); // Route: ['/pub/:slug', '/pub/:slug/branch/:branchShortId', '/pub/:slug/:mode']
// require('./pubTest'); // Route: '/pub-test'

/* Routes for PubPub */
require('./communityCreate'); // Route: '/community/create'
require('./explore'); // Route: '/explore'
require('./about'); // Route: '/about'
require('./pricing'); // Route: '/pricing'
require('./pubRedirect'); // Route: '/pub/:slug'
require('./adminDashboard'); // Route: '/admin'
require('./landing'); // Route: '/'

/* Routes for Communities */
require('./dashboard'); // Route: ['/dashboard', '/dashboard/:mode', '/dashboard/:mode/:slug']
// require('./pub'); // Route: ['/pub/:slug', '/pub/:slug/content/:chapterId', '/pub/:slug/draft', '/pub/:slug/draft/content/:chapterId', '/pub/:slug/:mode', '/pub/:slug/:mode/:subMode']
require('./page'); // Route: ['/', '/:slug']
require('./collection'); // Route: /collection/:id

/* Routes for all */
require('./login'); // Route: '/login'
require('./legal'); // Route: '/legal'
require('./search'); // Route: '/search'
require('./signup'); // Route: '/signup'
require('./passwordReset'); // Route: ['/password-reset', '/password-reset/:resetHash/:slug']
require('./userCreate'); // Route: '/user/create/:hash'
require('./user'); // Route: ['/user/:slug', '/user/:slug/:mode']
require('./noMatch'); // Route: '/*'
