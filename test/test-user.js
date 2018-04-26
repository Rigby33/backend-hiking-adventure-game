const chai = require('chai');
const chaiHttp = require('chai-http');

const { app, runServer, closeServer } = require('../server');
const { user } = require('../models/usermodel');
const { TEST_DATABASE_URL } = require('../config');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const expect = chai.expect;

chai.use(chaiHttp);

describe('Users Routes', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const usernameB = 'exampleUserB';
  const passwordB = 'examplePassB';

  before(function () {
    return runServer(TEST_DATABASE_URL);
  });

  after(function () {
    return closeServer();
  });

  beforeEach(function () { });

  afterEach(function () {
    return user.remove({});
  });
	describe('/user', function () {
		describe('POST', function () {
			it('Should reject users with missing username', function () {
				return chai
					.request(app)
					.post('/user')
					.send({
						password
					})
					.then((res) => {
						expect(res).to.have.status(422);
						expect(res.body.reason).to.equal('ValidationError');
						expect(res.body.message).to.equal('Missing field');
						expect(res.body.location).to.equal('username');
					})
			});
			it('Should reject users with missing password', function () {
				return chai
					.request(app)
					.post('/user')
					.send({
						username
					})
					.then((res) => {
						expect(res).to.have.status(422);
						expect(res.body.reason).to.equal('ValidationError');
						expect(res.body.message).to.equal('Missing field');
						expect(res.body.location).to.equal('password');
					})
			});
			it('Should reject users with password less than 7 characters', function () {
				return chai
					.request(app)
					.post('/user')
					.send({
						username,
						password: '123456'
					})
					.then((res) => {
						expect(res).to.have.status(422);
						expect(res.body.reason).to.equal('ValidationError');
						expect(res.body.message).to.equal('password must be at least 7 characters long');
						expect(res.body.location).to.equal('password');
					})
			});
			it('Should reject users with password greater than 72 characters', function () {
				return chai
					.request(app)
					.post('/user')
					.send({
						username,
						password: new Array(73).fill('a').join(''),
					})
					.then((res) => {
						expect(res).to.have.status(422);
						expect(res.body.reason).to.equal('ValidationError');
						expect(res.body.message).to.equal('password must be at most 72 characters long');
						expect(res.body.location).to.equal('password');
					})
			});
			it('Should reject users with duplicate username', function () {
				return user.create({
					username,
					password
				})
				.then(() =>
					chai.request(app).post('/user').send({
						username,
						password
					})
				)
				.then((res) => {
					expect(res).to.have.status(422);
					expect(res.body.reason).to.equal('ValidationError');
					expect(res.body.message).to.equal('Username has already been taken');
					expect(res.body.location).to.equal('username');
				})
			});
			it('Should create a new user', function () {
				return chai
				.request(app)
				.post('/user')
				.send({
					username,
					password
				})
				.then(res => {
					expect(res).to.have.status(201);
					expect(res.body).to.be.an('object');
					expect(res.body.username).to.equal(username);
					return user.findOne({username});
				})
				.then(user => {
					expect(user).to.not.be.null;
					return user.validatePassword(password);
				})
				.then(passwordIsCorrect => {
					expect(passwordIsCorrect).to.be.true;
				});
			});
	  	})
	  	describe('GET', function() {
	  		it('Should return an empty array initially', function() {
	  			return chai
	  			.request(app)
	  			.get('/user')
	  			.then((res) => {
	  				expect(res).to.have.status(200);
	  				expect(res.body).to.be.an('array');
	  				expect(res.body).to.have.length(0);
	  			})
	  		})
	  		it('Should return an array of users', function() {
				return user.create({
					username,
					password
				},
				{
					username: usernameB,
					password: passwordB
				})
				.then(() => chai.request(app).get('/user'))
				.then((res) => {
					expect(res).to.have.status(200);
					expect(res.body).to.be.an('array');
					expect(res.body).to.have.length(2);
				})
	  		})
	  	});
	  	describe('PUT', function () {
	  		it('Should update highscore of user', function () {
	  			let userId;
				return user.create({
					username,
					password
				})
				.then(() => {
					return user.findOne()
						.then((res) => {
							userId = res._id;
							return chai
								.request(app)
								.put(`/user/${userId}`)
								.send({highscore: 100})
						})
						.then((res) =>{
							expect(res).to.have.status(204);
							return user.findById(userId)
						})
						.then((res) => {
							expect(res.highscore).to.equal(100);
						})
				})
	  		})
	  	})
	})
});

// router.put('/:id', jsonParser, (req, res) => {
// 	user.findByIdAndUpdate(req.params.id, {$set: {highscore: req.body.highscore}}, {new: true})
// 		.then(updatedScore => res.status(204).end())
// 		.catch(err => res.status(500).json({message: 'Something went wrong'}));
// });