

var MongoDB = require("./mongodb.js");
MongoDB.initDB().then(function () {
    var Cat = require("./Cat.js");
    let kitty = new Cat({name : 'kitty-monther'});

    kitty.save(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log('meow');
        }
    });

    Cat.findOne({'name':'miaomiao'},(err,kitt)=>{
        console.log('get one cat :' + kitt);
    });

    Cat.find((err,cats)=>{
        console.log('get all cats :' + cats);
    });

}).catch(function (error) {
    console.error(error);
});