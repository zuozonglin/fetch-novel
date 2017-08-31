const async = require('async');
const execAsync = require('async-child-process').execAsync;

/**
 * 组内限制并发抓取
 * @param {*} data 
 * @param {*} number 
 * @param {*} method 
 */
var asyncFetch = function (data, number, method) {
	return new Promise(function (resolve, reject) {
		if (!data || data.length <= 0) {
			reject("data not exist")
		}
		//let resultCollection = [];
		async.mapLimit(data, number, async function (item, callback) {//arraydata limit iteratee callback
			//需要设置延时不然ip会被封掉
			let cmd = `node fetchChapter.js -u ${item.link} -f -p -i ${item.index}`, json,
				//获取一个内容就输出一个
				{
					stdout
				} = await execAsync(cmd, {
						//default value of maxBuffer is 200KB.
						maxBuffer: 1024 * 5000
					});
			console.log(`fetch chaper.index=${item.index}, get reponse json=${stdout}`);
			/*将内容保存到json中*/
			try {
				json = JSON.parse(stdout);//这里没必要从控制台读取，影响性能和速度
			} catch (error) {
				console.log(`fetch chapter.index=${item.index} error, parse json error`);
			}

			if(!json){
				json = {code:-1};
			}
			//保存index
			json.index = item.index;

			//callback(null, json); //此处callback是单个item完成需要做的事情，用户传入
			return json;
		}, function (err, jsons) {
			//回调函数在全部都执行完以后执行
			if (err) {
				reject(err);
			}
			resolve(jsons);
		});
	});//end promise
};

/**
 * 每个分组异步延时
 * @param {*} delay 
 * @param {*} counter 
 * @param {*} startIndex 
 * @param {*} endIndex 
 * @param {*} limit 
 * @param {*} chapter 
 */
var pieceAsync = function (counter, startIndex, endIndex, limit, chapter) {
	return new Promise((resolve, reject) => {
		try {
			console.log(`start counter=${counter} fetch await, from ${startIndex}---->${endIndex}`);
			var delay = parseInt(Math.random() * 1000 + 10)*counter;//随机延时
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
				console.log(`end counter=${counter} fetch, 完成时间: ${time / 1000}s`);
				resolve(chapterResult);
			}, delay);
		} catch (error) {
			console.log('pieceAsync error ', error);
			reject(error);
		}
	});
};

/**
 * 分组抓取，等待结果
 * @param {*} dataList 
 * @param {*} start 
 * @param {*} end 
 * @param {*} limit 组内并发
 * @param {*} groupLimit 组间并发
 */
var delayAsync = function (dataList, start, end, limit, groupLimit) {
	console.log(`prepare for fetch all chapters from ${start}---->${end} `);
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
			console.log(`begin plan fetch all chapters from ${start}---->${end} `);
			var paralleArray = [];
			let startIndex = start, endIndex;
			while (counter < count) {
				/*
				* 需要注意的是当剩余的任务不足以达到并发数的时候,要保证任务分割不能出界
				*/
				if (startIndex + limit < end) {
					endIndex = startIndex + limit;
				} else {
					endIndex = end;//截取出界
				}
				/*分割任务*/
				chapter = dataList.slice(startIndex, endIndex);
				paralleArray.push(async.asyncify(async.apply(pieceAsync, counter, startIndex, endIndex, limit, chapter)));//async.asyncify 包裹成异步函数

				counter++;
				startIndex = endIndex;//推进任务进行
			}

			async.parallelLimit(paralleArray, groupLimit, function (err, results) {
				if (results && results.length > 0) {
					results.forEach((value, index) => {
						result = result.concat(value);
					});
					resolve(result);
				} else {
					reject('fetch result emppty');
				}
			});
		} catch (e) {
			reject(e);
		}
	});//end promise
};

module.exports = {
	asyncFetch: asyncFetch,
	delayAsync: delayAsync
}