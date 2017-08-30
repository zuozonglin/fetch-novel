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

			/*
			  目前未知callback为什么是undefined
			*/
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

var pieceAsync = function(startIndex, endIndex, chapter){
	return new Promise(function(resolve,reject){
		
	});
};

/*实现延时加载的函数*/
var delayAsync = function (dataList, start, end, limit) {
	return new Promise(function (resolve, reject) {
		var result = [],
			counter = 0,
			checkTimer,
			checkTimeOut,
			fetchTimers = [],
			count = Math.ceil((end - start) / limit),//循环次数
			remain = start - end,//剩余
			i = 0;
		if (dataList.length <= 0) {
			//数据长度为空就返回
			reject("error");
			return;
		}
		//打印一下输入情况
		//console.log('input dataList : ', dataList);
		try {
			/*章数的开始和结束*/
			console.log(`开始抓取章节从 ${start} 到 ${end} `)
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
				//通过闭包实现IIFE保存当时抓取的情况,不使用闭包绑定的数据则是运行之后的值
				(function (startIndex, endIndex, chapter) {
					//通过tempTimer 保存下来
					let tempTimer = setTimeout(async function () {
						//获得此次任务开始执行的时间
						var startTime = new Date(), time, chapterResult = [];
						//进行并发捕获执行命令
						try {
							chapterResult = await asyncFetch(chapter, limit);
						} catch (e) {
							console.log(e);
						}
						result = result.concat(chapterResult);
						//用于判断任务标记 
						counter++;
						time = new Date() - startTime;
						console.log(`完成抓取章节 ${startIndex} 到 ${endIndex} 计数器是${counter} 时间是${time/1000}s`)
					}, i * 200);
					fetchTimers.push(tempTimer);

				})(startIndex, endIndex, chapter);
				i++; //控制延时
				//推进任务进行
				startIndex = endIndex;
			}
		} catch (e) {
			reject(e);
		}

		/*定时判断任务是否完成*/
		checkTimer = setInterval(function () {
			console.log(`counter is ${counter} , total is ${count} ,time = ${+new Date()}`);
			if (counter == count) {
				console.log('all fetch end success,and return result');
				//清除超时定时器
				clearTimeout(checkTimeOut);
				//清除自身定时器
				clearInterval(checkTimer);
				resolve(result);
			}
		}, 1000);

		//or use promise all ?
		//5mins计时器判断超时,超时进程退出
		checkTimeOut = setTimeout(function () {
			//超时清除所有定时器
			for (let i = 0; i < fetchTimers.length; i++) {
				clearTimeout(fetchTimers[i]);
			}
			//清除定时判断
			clearInterval(checkTimer);
			console.log("timout,stop all timer");
			reject(result);
		}, 5*60000);
	});//end promise
};

module.exports = {
	asyncFetch: asyncFetch,
	delayAsync: delayAsync
}