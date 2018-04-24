require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

const { router: usersRouter } = require('./router/userrouter');
const { router: authRouter } = require('./router/authrouter');
const { localStrategy, jwtStrategy } = require('./strategy');

mongoose.Promise = global.Promise;

const { PORT, MONGO_URL } = require('./config');

const app = express();

const cors = require('cors');
const {CLIENT_ORIGIN} = require('./config');

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

app.use(morgan('common'));

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/user', usersRouter);
app.use('/auth', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });


app.use('*', (req, res) => {
	return res.status(404).json({ message: 'Not found' });
});

let server;

function runServer(databaseUrl, port=PORT) {
	return new Promise((resolve, reject) => {
		mongoose.connect(databaseUrl, err => {
			if(err) {
				return reject(err);
			}
			server = app.listen(port, () => {
				console.log(`App is listening on port ${port}`);
				resolve();
			})
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});
}

function closeServer() {
	return mongoose.disconnect()
		.then(() => {
			return new Promise((resolve, reject) => {
				console.log('Closing server');
				server.close(err => {
					if(err) {
						return reject(err);
					}
					resolve();
				});
			});
		});
}

if(require.main === module) {
	runServer(MONGO_URL)
		.catch(err => console.log(err));
}

module.exports = { app, runServer, closeServer }