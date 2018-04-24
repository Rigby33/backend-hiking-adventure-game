const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
	username: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	highscore: {type: Number, default: 0}
});

userSchema.methods.serialize = () => {
	return {
		username: this.username,
		highscore: this.highscore
	}
};

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.statics.hashPassword = (password) => {
	return bcrypt.hash(password, 10);
};

const user = mongoose.model('user', userSchema);

module.exports = {user};