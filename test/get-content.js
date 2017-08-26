//这个方法,我的理解是跟你在chrome中的输出台的操作是一样的所以看看下面栗子
//await page.evaluate(function() {});

const phantom = require('phantom');
let url = encodeURI(`http://maijiabus.com`);
(async function () {
    const instance = await phantom.create();
    const page = await instance.createPage();
    const status = await page.open(url);
    if (status !== 'success') {
        console.log("访问失败");
        return;
    } else {
        let start = Date.now();
        let result = await page.evaluate(function () {
            return document.getElementById('top_search_text').placeholder;
        });
        let data = {
            cose: 1,
            msg: "抓取成功",
            time: Date.now() - start,
            dataList: result
        }
        console.log(JSON.stringify(data));
        await instance.exit();
    }

}());