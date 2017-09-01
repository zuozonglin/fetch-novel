const phantom = require('phantom');
const mkdirp = require('mkdirp');
const fsh = require('fs');
const fs = require('async-file');
const path = require('path');

const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36`;

/**
 * 非命令行版本的 fetchChapter 
 */

/**
 * 填充数字
 * @param {*} n 
 * @param {*} width 
 * @param {*} z 
 */
function pad(n, width, z) {
    if (typeof (n) == 'string') {
        if (!n) {
            return '';
        }
    }
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/*
替换br和&nbsp标签
*/
function puer(str) {
    if (!str) {
        return;
    }
    str = str.replace(/<br\s*\/?>/gi, "\r\n");
    str = str.replace(/&nbsp;/g, " ")
    return str;
}

var defaultParams = {
    puer: 'puerMode',
    file: 'save2File',
    url: '',
    index: '',
    path: '/book/default/'
};

async function fetchChapter(params) {
    let _params = Object.assign({}, defaultParams, params);

    if (!_params.url) {
        return;
    }
    _params.index = pad(params.index || '', 4);

    //创建实例
    const instance = await phantom.create();
    //创建页面容器
    const page = await instance.createPage();
    page.setting("userAgent", userAgent);

    var code = 1, timeoutId = null;
    var status = null;//await page.open(URL)
    await Promise.race([
        page.open(_params.url),
        new Promise((resolve, reject) => {
            timeoutId = setTimeout(() => {
                reject('timeout');
            }, 15000);//10s超时
        })
    ]).then(res => {
        status = res;
        clearTimeout(timeoutId);//不清除timeout，上面的promise会等待超时，进程才会退出
    }).catch(error => {
        console.log(`phantom open url=${_params.url}, error=${error}`);
    });

    if (status !== 'success') {
        await instance.exit();
        return { code: -1 };
    } else {
        // await page.includeJs("https://cdn.bootcss.com/jquery/1.12.4/jquery.js")
        // await page.render('germy.png');
        var start = Date.now();
        var result = await page.evaluate(function () {
            //移除一些无关内容(等于直接在结果网页上的dom上进行操作)
            //请注意这里如果调用console.log()是无效的!
            $("#content a:last-child").remove();
            $("#content script:last-child").remove();
            $("#content div:last-child").remove();
            $("#content script:last-child").remove();
            return ({
                title: $("h1").html().replace(/:/g, '：').replace(';', '：').replace(/\?/g, '？'),
                content: $("#content").html()
            });
        });
        if (result.title == '' || result.content == '') {
            await instance.exit();
            return { code: -1 };
        } else {
            //判断参数进一步处理
            if (_params.puer) {
                var context = puer(result.content);
            }
            //文件模式处理后进行保存到文件.返回文件路径
            if (_params.file) {
                let path = _params.path;
                //避免文件夹不存在,__dirname指向的是文件所在路径
                if (!fsh.existsSync(__dirname + path)) {
                    mkdirp.sync(__dirname + path);//使用同步方法
                }
                //拼接出文件输出的路径
                path += (_params.index ? _params.index + ' ' : '') + result.title + ".txt";
                await fs.writeFile(__dirname + path, context);

                //输出文件名
                // console.log(JSON.stringify({ code: 1, filePath: path }));

                await instance.exit();
                return { code: 1, filePath: path };
            } else {
                // console.log(JSON.stringify({  code: 1, content: result }));

                await instance.exit();
                return { code: 1, content: result };
            }
        }
    }
    //exit
    //await instance.exit();
}

module.exports = fetchChapter;