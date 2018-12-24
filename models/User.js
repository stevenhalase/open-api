const firearch = require('firearch');
const Schema = firearch.Schema;

const UserSchema = new Schema({
  username: String,
  password: String,
  name: String,
  image: String,
  contacts: [{ ref: 'User' }]
});

const autoPopulate = function(next) {
  this.populate({ path: 'contacts', model: 'User' });
  next();
};

UserSchema
  .pre('findById', autoPopulate);

UserSchema
  .pre('find', autoPopulate);

module.exports = firearch.model('User', UserSchema);