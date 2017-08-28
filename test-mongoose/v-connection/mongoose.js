var mongoose = require('mongoose');

mongoose.connect('mongodb://139.224.234.23/novel');

var db = mongoose.connection;
db.on('error',console.error.bind(console,'connection error'));
db.once('open',(callback)=>{console.log('mongodb opened!');});

module.exports = mongoose;