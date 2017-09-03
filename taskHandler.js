const BookModel = require('./model/Books.js');
const ChapterModel = require('./model/Chapters.js');
const fetchAllChapters = require('./fetchAllChapters.js');
const delayAsync = require('./asyncFetch.js').delayAsync;

/*
*  第一步获取章节连接,第二部获取章节内容并进行输出
* 输出方式一 输出到数据库.(未实现)
* 输出方式二 文件输出(在关注react-pdf,希望支持pdf输出)

* s 是章节开始(下标是0,所以需要手动减一,第一章就是 0)
* e 是结束章节数
* l 是并发数
* m 模式 0=直接抓取本书所有章节,1=直接冲数据读取章节链接
* b 书的编号
* test command: node taskHandler.js -s 400 -e 500 -l 5 -g 3 -b 5443
*/

var defaultParams = {
	start: 0,
	end: 100,
	limit: 5,
	groupLimit: 3,
	mode: 1,
	book: '5443',
	store: false,
	retry: 3
};

async function taskHandler(params) {
	var totalFetchStartTime = +new Date();//总时间
	try {
		let _params = Object.assign({}, defaultParams, params);

		console.log(`start taskHandler,and params=${JSON.stringify(_params)}`);

		let data = null,
			start = _params.start,
			end = _params.end,
			bookNumber = _params.book,
			dataList = null;

		if (_params.mode == 0) {//直接从网页抓取
			data = await fetchAllChapters(bookNumber);

			dataList = data['dataList'];
			if (!dataList) {
				console.log(`get dataList is empty, return`);
				return;
			}
			console.log('store books schema to mongo');
			let book = {
				bookNum: bookNumber,
				url: data.url,
				chapters: dataList,
			};
			let result = await BookModel.create(book);
			console.log('store books in mongo, response is ', result);
		} else if (_params.mode == 1) {//从数据库读取
			let book = await BookModel.getBookByBookNum(bookNumber);//typeof(book)=object
			console.log(`get book=${bookNumber} from mongo success`);
			dataList = book.chapters;
			if (!dataList) {
				console.log(`get dataList is empty, return`);
				return;
			}
		}

		console.log(`get book.chapters.length=${dataList.length} ,start fetch chapters detail`);

		let fetchResults = [], fetchResult = null, whileCounter = 0;
		while (!fetchResult || fetchResult.fail.length > 0) {
			whileCounter++;
			_params.whileCounter = whileCounter;
			if (whileCounter > 1) {
				_params.start = 0;
				_params.end = fetchResult.fail.length
				fetchResult = await delayAsync(fetchResult.fail, _params);//重新抓取失败列表
			}else{
				fetchResult = await delayAsync(dataList, _params);
			}
			console.log(`whileCounter=${whileCounter}, got fetchResult=\n${JSON.stringify(fetchResult)}\n`);
			if (!fetchResult) {
				console.log(`fetch error, got fetchResult empty, return`);
				return;
			} else {
				fetchResults = fetchResults.concat(fetchResult.succ);
			}
		}

		console.log('----got all fetchResult-->end----');

		if (_params.store) {
			console.log('store chapters schema to mongo');
			var chapters = await ChapterModel.create({
				bookNum: bookNumber,
				start: start,
				end: end,
				chapters: fetchResults
			});
			console.log('store chapters to mongo response by mongo,', chapters);
		}

		console.log(`----fetch all chapters from ${start} to ${end} , spend time is ${(+new Date() - totalFetchStartTime) / 1000}s----`);

		process.exit();
	} catch (e) {
		console.log(e);
	}
	return;
}

module.exports = taskHandler;