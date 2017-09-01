var fetchChapter = require('../fetchChapter.js');

(async function(){

    let start = +new Date();

    var res = await fetchChapter({
        url : 'http://www.qu.la/book/5443//3179367.html',
        index : '94',
    });

    console.log(`fetch chapter.index=94,time=${(+new Date()-start)/1000}s`);

})();