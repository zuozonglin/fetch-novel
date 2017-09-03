const phantom = require('phantom');

//设置用户代理头
const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`;

async function fetchAllChapters(bookNumber) {
	if (!bookNumber) {
		return;
	}
	const url = encodeURI(`http://www.qu.la/book/${bookNumber}/`);
	try {
		//提供async环境
		//创建实例
		const instance = await phantom.create([],{logLevel:'error'});
		//创建页面容器
		const page = await instance.createPage();
		//设置
		page.setting("userAgent", userAgent);
		//判断是否访问成功
		var status = await page.open(url), code = 1; // phantom 抓取网页做超时处理 =====！
		if (status !== 'success') {
			//访问失败修改状态码
			code = -1;
			return {code : code};
		} else {
			//获取当前时间
			var start = Date.now();
			var result = await page.evaluate(function () {
				var count = 1;
				return $('#list dl dd').map(function () {
					return ({
						index: count++,
						title: $(this).find('a').html(),
						link: url + ($(this).find('a').attr('href')).substring(($(this).find('a').attr('href')).lastIndexOf("/")),
					});
				}).toArray();
			});
			let data = {
				code: code,
				bookNumber: bookNumber,
				url: url,
				time: Date.now() - start,
				dataList: result
			};
			console.log(JSON.stringify(data));
			return data;
		}
		//退出实例
		await instance.exit();
	} catch (e) {
		console.log(e)
	}
}

module.exports = fetchAllChapters;