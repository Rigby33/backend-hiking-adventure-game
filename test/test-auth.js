const chai = require('chai');
const chaiHttp = require('chai-http');
const { app, runServer, closeServer } = require('../server');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const jwt = require('jsonwebtoken');
const { user } = require('../models/usermodel');
const expect = chai.expect;
chai.use(chaiHttp);

describe('Auth Routes', function() {
	const username = 'exampleUserA';
	const password = 'examplePasswordA';

	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	after(function() {
		return closeServer();
	});

	beforeEach(function() {
		return user.hashPassword(password)
			.then(password => 
				user.create({
					username,
					password
				})
			)
	})
	afterEach(function() {
		return user.remove()
	})

	describe('/auth/login', function() {
		it('Should reject requests with no credentials', function() {
			return chai
				.request(app)
				.post('/auth/login')
				.then((res) => {
					expect(res).to.have.status(400);
				})
		});
		it('Should reject requests with incorrect usernames', function() {
			return chai
				.request(app)
				.post('/auth/login')
				.send({username: 'wrongusername', password})
				.then((res) => {
					expect(res).to.have.status(401);
				})
		});
		it('Should reject requests with incorrect passwords', function() {
			return chai
				.request(app)
				.post('/auth/login')
				.send({username, password: 'wrongpassword'})
				.then((res) => {
					expect(res).to.have.status(401)
				})
		});
		it('Should return a valid auth token', function() {
			return chai
				.request(app)
				.post('/auth/login')
				.send({username, password})
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('object');
					const token = res.body.authToken;
					expect(token).to.be.a('string');
					const payload = jwt.verify(token, JWT_SECRET, {
						algorithm: ['HS256']
					});
					expect(payload.user.username).to.equal(username);
				})
		})
	})
})