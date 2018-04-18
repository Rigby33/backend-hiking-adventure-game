const { Strategy: LocalStrategy } = require('passport-local');

const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const { user } = require('./models/usermodel');
const { JWT_SECRET } = require('./config');
const localStrategy = new LocalStrategy((username, password, callback) => {
	user.findOne({ username: username })
		.then(_user => {
			logginginuser = _user;
			if(!logginginuser) {
				return Promise.reject({
					reason: 'LoginError',
					message: 'Incorrect username or password'
				});
			}
			return logginginuser.validatePassword(password)
		})
		.then(isValid => {
			if(!isValid) {
				return Promise.reject({
					reason: 'LoginError',
					message: 'Incorrect username or password'
				});
			}
			return callback(null, logginginuser);
		})
		.catch(err => {
			if(err.reason === 'LoginError') {
				return callback(null, false, err);
			}
			return callback(err, false)
		});
});

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
    algorithms: ['HS256']
  },
  (payload, done) => {
    done(null, payload.user);
  }
);

module.exports = { localStrategy, jwtStrategy };