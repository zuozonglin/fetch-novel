# phantom爬小说
 
 
## 爬虫内容
 爬笔趣阁上的小说,输出为本地文本。(仅做学习研究所用)
 [详细教程](https://github.com/Sunshine168/fetch-novel/blob/master/note.md)
 [简书](http://www.jianshu.com/p/d026345eb9b4)
    
## 用法

```
node taskHandler.js -s 100 -e 120 -l 5 -b 5443
/*
option
-s 开始章节
-e 结束章节
-b 书本num
-l 并发数量 每次并发相隔一秒
书本e.g:
http://www.qu.la/book/5443
5443就是书本的num
*/
```
      
## 实现
  基于Nodejs 7.9.0以上
  通过phantom进行访问内容,async库进行并发获取,加入延迟捕获,避免简单的爬取被封,
  commander辅助命令行工具。
  
  
  
### 目录结构

```
.
├── README.md  
├── asyncFetch.js  
├── book
│   └── default
├── fetchAllChapters.js
├── fetchChapter.js
├── germy.png
├── lib
│   └── mongo.js
├── media
│   └── 14995008770629
├── model
│   ├── Books.js
│   └── Chapters.js
├── note.md
├── package.json
├── taskHandler.js
├── test
│   └── testStore.js
├── test.js
└── util
    └── chapter2Number.js
```
	 
## 问题与思考
书本的章节可以捕获一次保存在数据库中,输入书本后判断书本是否已经捕获过章节了

捕获过就从数据库里获取需要的章节,提供方法检验是否有最新章节,

以文本形式储存阅读并不方便,如何更方便的阅读

在大量捕获的时候仍会被封停,缺少应对封停的机制

添加phantom proxy 进行代理,这里引出需要写一个抓取代理并测试的服务来提供代理池

Phantomjs 抓取网页超时的问题

实现方式改变，获取抓取结果不用读取控制台输出，影响性能

实现Phantomjs 实例池，提高 phantom webkit 的响应速度

重试3次以后的抓取失败章节存入数据库，等待下次处理或人工处理

对于章节数比较多的小说（超过5000章以上），任然要进行分篇处理 e.g. book=161

## 实现思路
1. Phantomjs 抓取所有章节连接

2. 获取所有章节连接，分割抓取每个章节的内容

3. async.Limit异步抓取，await同步等待结果