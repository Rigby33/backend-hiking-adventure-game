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

// app.use('/users', userRouter);
// app.use('/login', authRouter);

app.use(morgan('common'));

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.send(204);
  }
  next();
});

// app.use(
//     cors({
//         origin: CLIENT_ORIGIN
//     })
// );

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/user', usersRouter);
app.use('/auth', authRouter);

const jwtAuth = passport.authenticate('jwt', { session: false });

// A protected endpoint which needs a valid JWT to access it
app.get('/', jwtAuth, (req, res) => {
  return res.json({
    data: 'rosebud'
  });
});


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
// app.get('/', (req, res) => {
// 	console.log('hi it\'s working');
// 	res.json({})
// });

// app.listen(PORT, () => console.log(`App is listening on port ${PORT}`));
