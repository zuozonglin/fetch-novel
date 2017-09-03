var taskHandler = require('./taskHandler.js');

taskHandler({
    start: 1000,
    end: 1991,
    limit: 10,
    groupLimit: 3,
    mode: 1,
    book: '5443'
});