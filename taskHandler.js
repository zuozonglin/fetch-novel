const exec = require('child_process').exec;
const execAsync = require('async-child-process').execAsync;
const async = require('async');
const delayAsync = require('./asyncFetch.js').delayAsync;
const program = require('commander');
const BookModel = require('./model/Books.js');
const ChapterModel = require('./model/Chapters.js');
let cmd;
/*
s 是章节开始(下标是0,所以需要手动减一,第一章就是 0)
e 是结束章节数
l 是并发数
m 模式 0=直接抓取本书所有章节,1=直接冲数据读取章节链接
b 书的编号
test command:
node taskHandler.js -s 0 -e 100 -l 5 -b 5443 -m 1
*/

var totalFetchStartTime = +new Date();//总时间

program
	.version('0.1.0')
	.option('-s, --start [start]', 'start chapter', 0)
	.option('-e, --end [end]', 'end chapter', 100)
	.option('-l, --limit [limit]', 'limit async', 5)
	.option('-m, --mode [mode]', 'Add bbq sauce', 1)
	.option('-b, --book [book]', 'book number')
	.parse(process.argv);
/*
 第一步获取章节连接,第二部获取章节内容并进行输出
 输出方式一 输出到数据库.(未实现)
 输出方式二 文件输出(在关注react-pdf,希望支持pdf输出)
*/
if (!program.book) {
	return;
} else {
	cmd = `node fetchAllChapters.js -b ${program.book}`;
}
if (!program.start || !program.end) {
	console.log("must input with start-chapter and end-chapter ");
	return;
}

//异步抓取流程
(async function () {
	try {
		let data = null,
			start = parseInt(program.start),
			end = parseInt(program.end),
			limit = parseInt(program.limit),
			mode = parseInt(program.mode),
			bookNumber = program.book,
			dataList = null,
			fetchResult = null;

		if (mode == 0) {//直接从网页抓取
			const {
				stdout //调取子进程 执行cmd 获取结果
			} = await execAsync(cmd, {
				//default value of maxBuffer is 200KB.
				maxBuffer: 1024 * 5000
			});
			data = JSON.parse(stdout);
			dataList = data['dataList'];

			// console.log('store books schema to mongo');
			let book = {
				bookNum: bookNumber,
				url: data.url,
				chapters: dataList,
			},
				result = await BookModel.create(book);
			console.log('store books in mongo, response is ', result);
		} else if (mode == 1) {//从数据库读取
			let book = await BookModel.getBookByBookNum(bookNumber);//typeof(book)=object
			console.log(`get book=${bookNumber} from mongo success`);
			dataList = book.chapters;
		}

		if (!dataList) {
			return;
		}

		// console.log(dataList)
		console.log('get all chapters end,start fetch chapters detail');

		//分发任务 每10s调取一次并发抓取10条记录 
		//截取需要的章节数
		/*根据章节,章节是一开始,默认无序章*/
		//dataList, start, end, limit
		//下面是抓每章内容

		fetchResult = await delayAsync(dataList, start, end, limit, 3);//2*5 并发测试效率比较高
		console.log('----got all fetchResult-->end----');
		console.log(fetchResult);

		// console.log('store chapters schema to mongo');
		// var chapters = await ChapterModel.create({
		// 	bookNum: data.bookNumber,
		// 	start: start,
		// 	end: end,
		// 	chapters: fetchResult
		// });
		// console.log('store chapters to mongo response by mongo,', chapters);

		console.log(`----fetch all chapters from ${start} to ${end} , spend time is ${(+new Date() - totalFetchStartTime) / 1000}s----`);

		process.exit();
	} catch (e) {
		console.log(e);
	}
	return;
})();