import Promise from 'bluebird';
import passport from 'passport';
import app from '../server';
import { User, Signup } from '../models';
import { slugifyString } from '../utilities';
import { subscribeUser } from '../mailchimpHelpers';
import { updateUserData } from '../searchUtilities';

app.post('/api/users', (req, res)=> {
	// Check that hash and email sync up
	// Create user
	// Update SignUp to 'completed'
	// Get and return authenticated user data
	const email = req.body.email.toLowerCase().trim();
	const firstName = req.body.firstName.trim();
	const lastName = req.body.lastName.trim();
	const fullName = `${firstName} ${lastName}`;
	const initials = `${firstName[0]}${lastName[0]}`;
	const newSlug = slugifyString(fullName);
	Signup.findOne({
		where: { hash: req.body.hash, email: req.body.email.toLowerCase() },
		attributes: ['email', 'hash', 'completed']
	})
	.then((signUpData)=> {
		if (!signUpData) { throw new Error('Hash not valid'); }
		if (signUpData.completed) { throw new Error('Account already created'); }
		return User.count({
			where: {
				slug: { $ilike: `${newSlug}%` }
			}
		});
	})
	.then((existingSlugCount)=> {
		const newUser = {
			slug: `${newSlug}${existingSlugCount ? `-${existingSlugCount + 1}` : ''}`,
			firstName: firstName,
			lastName: lastName,
			fullName: fullName,
			initials: initials,
			email: email,
			avatar: req.body.avatar,
			title: req.body.title,
			bio: req.body.bio,
			location: req.body.location,
			website: req.body.website,
			orcid: req.body.orcid,
			github: req.body.github,
			twitter: req.body.twitter,
			facebook: req.body.facebook,
			googleScholar: req.body.googleScholar,
			passwordDigest: 'sha512',
		};

		const userRegister = Promise.promisify(User.register, { context: User });
		return userRegister(newUser, req.body.password);
	})
	.then(()=> {
		if (req.body.subscribed) {
			subscribeUser(req.body.email, '2847d5271c', ['Users']);
		}
		return Signup.update({ completed: true }, {
			where: { email: email, hash: req.body.hash, completed: false },
		});
	})
	.then(()=> {
		passport.authenticate('local')(req, res, ()=> {
			return res.status(201).json('success');
		});
	})
	.catch((err)=> {
		console.error('Error in postUser: ', err);
		return res.status(500).json(err);
	});
});

app.put('/api/users', (req, res)=> {
	const user = req.user || {};
	const authenticated = req.user && req.user.id === user.id;
	if (!authenticated) { return res.status(500).json('Unauthorized'); }

	// Filter to only allow certain fields to be updated
	const updatedUser = {};
	Object.keys(req.body).forEach((key)=> {
		if (['slug', 'firstName', 'lastName', 'avatar', 'title', 'bio', 'location', 'website', 'orcid', 'github', 'twitter', 'facebook', 'googleScholar'].indexOf(key) > -1) {
			updatedUser[key] = req.body[key] && req.body[key].trim ? req.body[key].trim() : req.body[key];
			if (key === 'slug') {
				updatedUser.slug = updatedUser.slug.toLowerCase();
			}
			if (key === 'firstName' || key === 'lastName') {
				updatedUser[key] = updatedUser[key].trim();
			}
		}
	});

	updatedUser.fullName = `${updatedUser.firstName} ${updatedUser.lastName}`;
	updatedUser.initials = `${updatedUser.firstName[0]}${updatedUser.lastName[0]}`;

	return User.update(updatedUser, {
		where: { id: req.body.userId }
	})
	.then(()=> {
		if (user.fullName !== updatedUser.fullName) {
			updateUserData(user.id);
		}
		return res.status(201).json('success');
	})
	.catch((err)=> {
		console.error('Error putting User', err);
		return res.status(500).json(err);
	});
});
