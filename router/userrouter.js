const express = require('express');
const {user} = require('../models/usermodel');
const route = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const router = express.Router();

router.post('/', jsonParser, (req, res) => {
	const requiredFields = ['username', 'password'];
	const missingField = requiredFields.find(field => !(field in req.body));

	if(missingField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Missing field',
			location: missingField
		});
	}

	const sizedFields = {
		username: {
			min: 1
		},
		password: {
			min: 7,
			max: 72
		}
	};

	const tooSmallField = Object.keys(sizedFields).find(
			field => 'min' in sizedFields[field] && req.body[field].trim().length < sizedFields[field].min
		);
	const tooLargeField = Object.keys(sizedFields).find(
			field => 'max' in sizedFields[field] && req.body[field].trim().length > sizedFields[field].max
		);

	if(tooSmallField || tooLargeField) {
		const message = tooSmallField ? `${tooSmallField} must be at least ${sizedFields[tooSmallField].min} characters long` : `${tooLargeField} must be at most ${sizedFields[tooLargeField].max}`;
	    return res.status(422).json({
	      code: 422,
	      reasons: 'ValidationError',
	      message: message,
	      location: tooSmallField || tooLargeField
	    });
	}

    let {username, password} = req.body;

    return user.find({username})
	    .count()
	    .then(count => {
	    	if(count > 0) {
	    		return Promise.reject({
	    			code: 422,
	    			reason: 'ValidationError',
	    			message: 'Username has already been taken',
	    			location: 'username'
	    		});
	    	}
	    	return user.hashPassword(password);
	    })
	    .then(hash => {
	    	return user.create({
	    		username,
	    		password: hash
	    	});
	    })
	    .then(user => {
	    	return res.status(201).json(user.serialize());
	    })
	    .catch(err => {
	    	console.log(err);
	    	if(err.reason === 'ValidationError') {
	    		return res.status(err.code).json(err);
	    	}
	    	res.status(500).json({code: 500, message: 'Internal server error'});
	    });
});

router.get('/', (req, res) => {
	return user.find()
		.then(users => res.json(users.map(user => user.serialize())))
		.catch(err => res.status(500).json({message: 'Internal server error'}))
});

module.exports = {router}