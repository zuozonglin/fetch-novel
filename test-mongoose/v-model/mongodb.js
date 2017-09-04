/**
 * mongodb操作类
 * @type {*}
 */
var mongoose = require('mongoose');
var logger = console;
var Promise = require('bluebird');
var uri = 'mongodb://127.0.0.1/novel';
var init = false;
module.exports = {
    initDB: function () {
        return new Promise(function (resolve, reject) {
            if (init == true) {
                resolve();
                return;
            }
            var options = {
                poolSize: 2,
                // promiseLibrary: require('bluebird'),
                useMongoClient: true
                // replset: { rs_name: 'myReplicaSetName' },
                // user: 'myUserName',
                // pass: 'myPassword'
            }
            mongoose.set('debug', true);
            // Use bluebird
            mongoose.Promise = Promise;
            mongoose.connect(uri, options);
            var db = mongoose.connection;
            db.on("error", function (err) {
                logger.error("connect mongodb failed url=%s error=%s", uri, err);
            });
            db.once('open', function () {
                logger.info("connected mongodb url=", uri);
                init = true;
                resolve();
            });
        });
    },

    save: function (entity) {
        entity.save(function (err) {
            if (err) {
                logger.log(err);
            }
            logger.log('save successful !');
        });
    }

};