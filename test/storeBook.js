const BookModel = require('./model/Books.js');
// ...
if (!dataList || data.length <= 0) {
    return
}
/*储存数据*/
let book = {
    bookNum: data.bookNumber,
    url: data.url,
    chapters: dataList,
},
    result = await BookModel.create(book);
console.log(result)
//...