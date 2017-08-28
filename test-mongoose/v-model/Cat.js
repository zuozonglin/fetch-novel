var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Cat = new Schema({
    name: String
});
var model = mongoose.model('cat', Cat);

module.exports = model;