var mongoose = require('./mongoose.js');

var userSchema = mongoose.Schema({
    impression: { type: String },
    author: { type: String }
});

var userModel = mongoose.model('friend', userSchema);

var friend = new userModel({ impression: 'fool', author: 'sweety' });
friend.save((err) => {
    if (err) { return console.error(err) };
    console.log('save friend success');
});

userModel.find((err, docs) => {
    if (err) { return console.error(err) };
    console.log('get friend: ' + docs);
});