const async = require('async');
const execAsync = require('async-child-process').execAsync;
/*实现并发抓取的函数*/
var asyncFetch = function (data, number, method) {
	return new Promise(function (resolve, reject) {
		if (!data || data.length <= 0) {
			reject("data not exist")
		}
		let resultCollection = [];
		async.mapLimit(data, number, async function (data, callback) {//array limit iterator callback
			//需要设置延时不然ip会被封掉
			let cmd = `node fetchChapter.js -u ${data.link} -f -p -i ${data.index}`, json,
				//获取一个内容就输出一个
				{
					stdout
				} = await execAsync(cmd, {
						//default value of maxBuffer is 200KB.
						maxBuffer: 1024 * 5000
					});
			console.log(`fetchChaper get reponse json=${stdout}`);
			/*将内容保存到json中*/
			json = JSON.parse(stdout);
			//保存index
			json.index = data.index;

			resultCollection.push(json);
			// callback(null, json) //not work
		}, function (err) {
			//回调函数在全部都执行完以后执行
			if (err) {
				reject(err);
			}
			resolve(resultCollection);
		});
	});//end promise
};

var pieceAsync = function (delay, counter, startIndex, endIndex, limit, chapter) {
	return new Promise(function (resolve, reject) {
		try {
			console.log(`开始计划分组抓取章节 ${startIndex} 到 ${endIndex} 组号是${counter}`);
			setTimeout(async function () {
				//获得此次任务开始执行的时间
				var startTime = new Date(), time, chapterResult = [];
				//进行并发捕获执行命令
				try {
					chapterResult = await asyncFetch(chapter, limit);
				} catch (e) {
					console.log(e);
					reject(e);
				}

				time = new Date() - startTime;
				console.log(`完成抓取章节 ${startIndex} 到 ${endIndex} ,组号是${counter} ,完成时间:${time / 1000}s`)

				resolve(chapterResult);

			}, delay);
		} catch (error) {
			console.log('pieceAsync error ', error);
			reject(error);
		}
	});
};

/*实现延时加载的函数*/
var delayAsync = function (dataList, start, end, limit) {
	console.log(`开始准备延时抓取 ${start}---->${end} `);
	
	return new Promise(async function (resolve, reject) {
		var result = [], counter = 0, count = Math.ceil((end - start) / limit)//循环次数
		if (dataList.length <= 0) {
			//数据长度为空就返回
			reject("error");
			return;
		}
		//打印一下输入情况
		//console.log('input dataList : ', dataList);
		try {
			/*章数的开始和结束*/
			console.log(`开始抓取章节从 ${start} 到 ${end} `);
			let startIndex = start, endIndex;
			while (startIndex != end) {
				/*
				需要注意的是当剩余的任务不足以达到并发数的时候
			    要保证任务分割不能出界
				*/
				if (startIndex + limit < end) {
					endIndex = startIndex + limit;
				} else {
					//截取出界
					endIndex = end;
				}
				/*分割任务*/
				chapter = dataList.slice(startIndex, endIndex);
				var delay = parseInt(Math.random() * 100 + 10) * 10;//随机延时
				var chapterResult = [];

				try {
					chapterResult = await pieceAsync(delay, counter, startIndex, endIndex, limit, chapter);
					result = result.concat(chapterResult);
					console.log('delayAsync get current result ---->', result);
				} catch (error) {
					console.log(error);
					reject(error);
				}
				counter++;
				startIndex = endIndex;//推进任务进行
			}
			resolve(result);
		} catch (e) {
			reject(e);
		}
	});//end promise
};

module.exports = {
	asyncFetch: asyncFetch,
	delayAsync: delayAsync
}