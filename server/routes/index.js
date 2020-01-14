require('./redirects'); // Redirect needed v3 routes;

/* Routes for Communities */
require('./dashboard'); // Route: ['/dashboard', '/dashboard/:mode', '/dashboard/:mode/:slug']
// require('./dash'); // Route: '/'
require('./pub'); // Route: ['/pub/:slug', '/pub/:slug/branch/:branchShortId', '/pub/:slug/:mode']
require('./collection'); // Route: /collection/:id
require('./dashboardOverview'); // Route: ['/dash', '/dash/overview', '/dash/collection/:collectionSlug', '/dash/collection/:collectionSlug/overview', '/dash/pub/:pubSlug', '/dash/pub/:pubSlug/overview']
require('./dashboardMembers');

/* Routes for PubPub */
require('./communityCreate'); // Route: '/community/create'
require('./explore'); // Route: '/explore'
require('./about'); // Route: '/about'
require('./pricing'); // Route: '/pricing'
require('./pubRedirect'); // Route: '/pub/:slug'
require('./adminDashboard'); // Route: '/admin'
require('./landing'); // Route: '/'

/* Routes for all */
require('./login'); // Route: '/login'
require('./privacy'); // Route: '/privacy'
require('./search'); // Route: '/search'
require('./signup'); // Route: '/signup'
require('./terms'); // Route: '/tos'
require('./passwordReset'); // Route: ['/password-reset', '/password-reset/:resetHash/:slug']
require('./userCreate'); // Route: '/user/create/:hash'
require('./user'); // Route: ['/user/:slug', '/user/:slug/:mode']
require('./page'); // Route: ['/', '/:slug']
require('./noMatch'); // Route: '/*'

// dashboardOverview
// dashboardActivity
// dashboardConversations
// dashboardReviews
// dashboardMembers
// dashboardMetrics
// dashboardSettings
// dashboardSite
