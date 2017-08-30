const ChapterModel = require('./model/Chapters.js');

//....
try {
    fetchResult = await delayAsync(dataList, start, end, limit);
    console.log(fetchResult)
    var chapters = await Chapter.create({
        bookNum: data.bookNumber,
        start: start,
        end: end,
        chapters: fetchResult,
    });
    console.log(chapters)
} catch (e) {
    console.log(e)
}