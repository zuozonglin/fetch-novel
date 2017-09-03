const async = require('async');
const fetchChapter = require('./fetchChapter.js');

/**
 * 组内限制并发抓取
 * @param {Array} data 按组分割的章节
 * @param {number} limit 
 * @param {number} retry 
 * @param {*} callback 
 */
var asyncFetch = function (data, limit, retry, callback) {
	return new Promise(function (resolve, reject) {
		if (!data || data.length <= 0) {
			reject("data not exist");
		}
		let failArray = [], succArray = [], giveupArray = [];
		async.mapLimit(data, limit, async function (item, callback) {//arraydata limit iteratee callback
			//需要设置延时不然ip会被封掉
			let json = await fetchChapter({ url: item.link, index: item.index });

			console.log(`fetch chaper.index=${item.index}, get reponse json=${JSON.stringify(json)}`);

			if (!json) {
				json = { code: -1 };
			}

			json.index = item.index;//保存index

			if (json.code != 1) {//需要重新抓取
				json.link = item.link;

				if (item.retry) {
					json.retry = item.retry + 1;
				} else {
					json.retry = 1;
				}
				if (json.retry <= retry) {
					failArray.push(json);
				} else {
					console.log(`fetch chapter.index=${json.index} fail, url=${json.link}, after try ${retry} times`);
					giveupArray.push(json);
				}
			} else {
				succArray.push(json);
			}
			//callback(null, json); //此处callback是单个item完成需要做的事情，用户传入
		}, function (err, jsons) {
			//此回调函数在全部都执行完以后执行
			if (err) {
				reject(err);
			}
			resolve({ succ: succArray, fail: failArray, giveup: giveupArray });
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
 * @param {*} chapters 
 * @param {number} retry 
 */
var pieceAsync = function (counter, startIndex, endIndex, limit, chapters, retry) {
	return new Promise((resolve, reject) => {
		try {
			console.log(`start counter=${counter} fetch await, from ${startIndex}---->${endIndex}, time = ${+new Date()}`);
			var delay = parseInt(Math.random() * 300 + 100);//随机延时  * (counter + 1)
			setTimeout(async function () {
				//获得此次任务开始执行的时间
				let startTime = new Date(), time, results = {};
				//进行并发捕获执行命令
				try {
					results = await asyncFetch(chapters, limit, retry);
				} catch (e) {
					console.log(e);
					reject(e);
				}
				time = new Date() - startTime;
				console.log(`end counter=${counter} fetch, 完成时间: ${time / 1000}s, delay=${delay}ms, end time = ${+new Date()}`);
				resolve(results);
			}, delay);
		} catch (error) {
			console.log('pieceAsync error ', error);
			reject(error);
		}
	});
};

/**
 * 分组抓取，等待结果
 * @param {Object} dataList 
 * @param {Object} params 抓取参数
 * {number} params.start 
 * {number} params.end 
 * {number} params.limit 组内并发
 * {number} params.groupLimit 组间并发
 * {number} params.retry 最大重试次数
 */
var delayAsync = function (dataList, params) {
	console.log(`prepare for fetch all chapters from ${params.start}---->${params.end}, total counter = ${params.whileCounter} `);
	return new Promise(async function (resolve, reject) {
		var result = { succ: [], fail: [], giveup: [] }, counter = 0, count = Math.ceil((params.end - params.start) / params.limit);//循环次数
		if (dataList.length <= 0) {
			//数据长度为空就返回
			reject("error");
			return;
		}
		try {
			var paralleArray = [];
			let startIndex = params.start, endIndex;
			while (counter < count) {
				/*
				* 需要注意的是当剩余的任务不足以达到并发数的时候,要保证任务分割不能出界
				*/
				if (startIndex + params.limit < params.end) {
					endIndex = startIndex + params.limit;
				} else {
					endIndex = params.end;//截取出界
				}
				/*分割任务*/
				let chapters = dataList.slice(startIndex, endIndex);
				paralleArray.push(async.asyncify(async.apply(pieceAsync, counter, startIndex, endIndex, params.limit, chapters, params.retry)));//async.asyncify 包裹成异步函数

				counter++;
				startIndex = endIndex;//推进任务进行
			}

			async.parallelLimit(paralleArray, params.groupLimit, function (err, results) {
				if (results && results.length > 0) {
					results.forEach((value, index) => {
						result.succ = result.succ.concat(value.succ);
						result.fail = result.fail.concat(value.fail);
						result.giveup = result.giveup.concat(value.giveup);
					});
					resolve(result);
				} else {
					reject('delayAsync fetch result emppty');
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