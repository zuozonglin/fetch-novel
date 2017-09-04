var mongoose = require('mongoose');
var uri = 'mongodb://127.0.0.1/novel';
// Use bluebird
var options = { promiseLibrary: require('bluebird') };
var db = mongoose.createConnection(uri, options);

Cat = db.model('cat', { name: String });

db.on('open', function () {
    console.log('cat mongoose opened!');
    //assert.equal(Cat.collection.findOne().constructor, require('bluebird'));

    Cat.find((err,cats)=>{
        console.log('get all cats:');
        console.log(cats);
    });
});