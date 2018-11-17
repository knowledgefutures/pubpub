require('./redirects');			// Redirect needed v3 routes;

/* Routes for PubPub */
require('./communityCreate');	// Route: '/community/create'
require('./explore');			// Route: '/explore'
require('./about');				// Route: '/about'
require('./pricing');			// Route: '/pricing'
require('./pubRedirect');		// Route: '/pub/:slug'
require('./landing');			// Route: '/'

/* Routes for Communities */
require('./dashboard');			// Route: ['/dashboard', '/dashboard/:mode', '/dashboard/:mode/:slug']
require('./pub');				// Route: ['/pub/:slug', '/pub/:slug/content/:chapterId', '/pub/:slug/draft', '/pub/:slug/draft/content/:chapterId', '/pub/:slug/:mode', '/pub/:slug/:mode/:subMode']
require('./page');		 		// Route: ['/', '/:slug']

/* Routes for all */
require('./login'); 			// Route: '/login'
require('./privacy'); 			// Route: '/privacy'
require('./search'); 			// Route: '/search'
require('./signup'); 			// Route: '/signup'
require('./terms'); 			// Route: '/tos'
require('./passwordReset'); 	// Route: ['/password-reset', '/password-reset/:resetHash/:slug']
require('./userCreate'); 		// Route: '/user/create/:hash'
require('./user'); 				// Route: ['/user/:slug', '/user/:slug/:mode']
require('./noMatch');			// Route: '/*'
