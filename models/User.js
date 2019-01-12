const firearch = require('firearch');
const Schema = firearch.Schema;

const UserSchema = new Schema({
  username: String,
  password: String,
  name: String,
  image: String,
  contacts: [{ ref: 'User' }],
  outgoingContactRequests: [{ ref: 'User' }],
  incomingContactRequests: [{ ref: 'User' }]
});

const autoPopulate = function(next) {
  this.populate({ path: 'contacts', model: 'User' });
  this.populate({ path: 'outgoingContactRequests', model: 'User' });
  this.populate({ path: 'incomingContactRequests', model: 'User' });
  next();
};

UserSchema
  .pre('findById', autoPopulate);

UserSchema
  .pre('find', autoPopulate);

module.exports = firearch.model('User', UserSchema);