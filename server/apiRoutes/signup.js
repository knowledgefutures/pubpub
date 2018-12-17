import app from '../server';
import { generateHash } from '../utilities';
import { sequelize, Signup, User } from '../models';
import { sendSignupEmail } from '../emailHelpers';

app.post('/api/signup', (req, res)=> {
	/* First, try to update the emailSentCount. */
	/* If there are no records to update, then we create a new one. */
	/* If this fails, it is because the email must be unique and it is already used */
	const email = req.body.email.toLowerCase().trim();
	User.findOne({
		where: { email: email }
	})
	.then((userData)=> {
		if (userData) { throw new Error('Email already used'); }

		return Signup.update({ count: sequelize.literal('count + 1') }, {
			where: { email: email, completed: false }
		});
	})
	.then((updateCount)=> {
		if (updateCount[0]) {
			return null;
		}
		return Signup.create({
			email: email,
			hash: generateHash(),
			count: 1,
			completed: false,
			communityId: req.body.communityId,
		});
	})
	.then(()=> {
		return Signup.findOne({ where: { email: req.body.email } });
	})
	.then((signUpData)=> {
		return sendSignupEmail({
			toEmail: signUpData.email,
			signupUrl: `https://${req.hostname}/user/create/${signUpData.hash}`
		});
	})
	.then(()=> {
		return res.status(201).json(true);
	})
	.catch((err)=> {
		console.error('Error in post signUp: ', err);
		return res.status(500).json('Email already used');
	});
});
