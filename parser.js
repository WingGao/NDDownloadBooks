const url = require('url');
const _ = require('lodash');
let fetch = require('node-fetch');
const http = require('http');
const HttpsProxyAgent = require('https-proxy-agent');
const cheerio = require('cheerio')
let FormData = require('form-data');
const path = require('path');
const fs = require('fs');
const Iconv = require('iconv').Iconv;
const iconv = new Iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');
const { StringDecoder } = require('string_decoder');
const DEBUG = false //测试专用
const {XsData, Encoding} = require("./xsdata")

const ProxyHttp = 'http://localhost:8032'

class Book {
    constructor() {
        this.name = ''
        this.author = ''
        this.url = ''
        //{id:0, url:'', text:null}
        this.chapters = []
        this.chapterParser = null
        this.outDir = path.join(__dirname, 'out')
        this.tempDir = path.join(__dirname, 'temp')
        if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);
        this.iconv = null
        this.proxy = false
    }

    getFileName() {
        return `《${this.name}》 作者：${this.author}`
    }

    formatChapter(chapterText) {
        let txt = chapterText.replace(/&nbsp;|\u00a0/ig, ' ').replace(/<p>|\r|/ig, '').replace(/<\/p>|<br>/ig, '\n');
        // debugger
        return txt.replace(/\n+/ig, '\n') //替换多余换行
    }

    asyncDownloadChapert(chapter) {
        return new Promise((resolve, reject) => {
            //判断缓存
            let cacheFile = path.join(this.tempDir, chapter.url.replace(/[:/]/g, '_'))
            let downloadPromise;
            if (fs.existsSync(cacheFile)) {
                downloadPromise = Promise.resolve(fs.readFileSync(cacheFile).toString())
            } else {
                downloadPromise = mFetch(chapter.url, {proxy: this.proxy}).then(res => res.text()).then(txt => {
                    fs.writeFileSync(cacheFile, txt)
                    return txt
                })
            }
            downloadPromise.then(body => {
                let p1 = new Promise((resolve2, reject2) => {
                    this.chapterParser(body, resolve2)
                })
                p1.then(text => {
                    resolve(this.formatChapter(text))
                })
            })
        })
    }

    downloadChapters() {
        let allPromNul = this.chapters.length
        let donePromNum = 0
        const maxWorker = 10
        let currentWorker = 0
        let chapters = DEBUG ? _.take(this.chapters, 10) : this.chapters;
        chapters.forEach((chapter) => {
            let ci = setInterval(() => {
                if (currentWorker < maxWorker) {
                    currentWorker++
                    clearInterval(ci)
                    let p = this.asyncDownloadChapert(chapter).then(text => {
                        currentWorker--
                        chapter.text = text
                        donePromNum++
                        console.log(`download ${donePromNum}/${chapters.length}`)
                    })
                }
            }, 100)
        })

        return new Promise((resovle, reject) => {
            let it = setInterval(() => {
                if (chapters.length == donePromNum) {
                    console.log('download finish')
                    clearInterval(it)
                    resovle(true)
                }
            }, 300)
        })
        // this.asyncDownloadChapert(this.chapters[0]).then(text=>{
        //     debugger
        // })
    }

    toTxt() {
        let fname = path.join(this.outDir, this.getFileName() + '.txt')
        let txt = this.getFileName() + `\n${this.url}\n======\n\n` + this.chapters.map(chapter => {
            return chapter.text == null ? '' : chapter.text
        }).join('\n\n')
        fs.writeFile(fname, txt, (err) => {
            if (err) {
                return console.log(err);
            }

            console.log(fname, "saved!");
        });
    }
}


// http://www.quanben.io
function parserQuanbenIo(bookUrl) {
    let book = new Book();
    if (!_.endsWith(bookUrl, 'list.html')) {
        bookUrl = bookUrl + 'list.html'
    }
    fetch(bookUrl).then((res) => res.text()).then(body => {
        let $ = cheerio.load(body);
        book.name = $('.list2 h3 span').text().trim();
        book.author = $('.list2 span[itemprop="author"]').text().trim();
        //章节列表
        _.each($('.list3 li a'), (domA, i) => {
            book.chapters.push({id: i, url: url.resolve(bookUrl, domA.attribs.href)})
        })
        book.chapterParser = (chapterBody, resolve) => {
            //ajax_post('book','ajax','pinyin','jianshen','id','1','sky','e6a285f7aa600dcd7dbb89f7e685b51d','t','1494782614')
            let reg = /ajax_post\(('book'.*?)\)/g
            let postArgsStr = reg.exec(chapterBody)
            let postArgs = postArgsStr[1].split(',').map(v => _.trim(v, "'"))
            // let form = new FormData();
            let form = ''
            for (let i = 2; i < postArgs.length; i = i + 2) {
                let field_name = postArgs[i] ? postArgs[i] : '';
                let field_value = postArgs[i + 1] ? postArgs[i + 1] : '';
                form += field_name + '=' + field_value + '&'
            }
            fetch('http://www.quanben.io/index.php?c=book&a=ajax', {
                method: 'POST',
                body: form,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(res => res.text()).then(body => {
                resolve(body)
            })
        }
        book.downloadChapters().then(() => {
            book.toTxt()
        })
    })
}

//http://wap.44pq.com
function parser44pq(bookUrl) {
    let book = new Book();

    fetch(bookUrl).then((res) => res.text()).then(body => {
        let $ = cheerio.load(body);
        let $bookname = $('.cover h1')
        book.name = $bookname.text().trim();
        book.author = $bookname.next('p').find('a').text().trim();
        //章节列表
        _.each(_.reverse($('ul.chapter li a')), (domA, i) => {
            book.chapters.push({id: i, url: url.resolve(bookUrl, domA.attribs.href)})
        })
        // book.chapters = book.chapters.slice(0, 2)
        book.chapterParser = (chapterBody, resolve) => {
            let $2 = cheerio.load(chapterBody, {decodeEntities: false});
            let chapName = $2('#nr_title').text().replace(/(第.+章)/gu, '$1  ')
            let chap = $2('#txt').html()
            resolve(chapName + '\n\n' + chap)
        }
        book.downloadChapters().then(() => {
            book.toTxt()
        })
    })
}

function parseHtml($, item) {
    if (item instanceof RegExp) {
        let res = _.cloneDeep(item).exec($.html())
        return _.size(res) === 0 ? '' : _.last(res);
    } else {
        return $(item).text().trim();
    }
}

function mFetch(url, conf) {
    conf = _.merge({
        agent: DEBUG ? new HttpsProxyAgent("http://127.0.0.1:8888") : null,
    }, conf);
    if (conf.proxy) {
        conf.proxy = null
        conf.agent = new HttpsProxyAgent(ProxyHttp)
    }
    return fetch(url, conf);
}

function parserSite(site, bookUrl) {
    let book = new Book();
    book.url = bookUrl
    book.proxy = site.proxy

    mFetch(bookUrl, {proxy: site.proxy}).then((res) => res.text()).then(body => {
        let $ = cheerio.load(body, {decodeEntities: false});
        book.name = parseHtml($, site.bookName);
        book.author = parseHtml($, site.bookAuthor);
        console.log('书名：', book.name);
        console.log('作者：', book.author);
        //章节列表
        let chapters = []
        _.each($(site.chapterList), (domA, i) => {
            let href = domA.attribs.href.trim()
            if (site.chapterUrlReg.test(href)) {
                chapters.push(href)
                // book.chapters.push({ id: 0, url: url.resolve(bookUrl, href) })
            } else {
                // console.log(`not match "${href}"`)
            }
        })
        //排序章节
        book.chapters = _.map(_.uniq(chapters).sort((a, b) => {
            return parseInt(a) - parseInt(b)
        }), (v, i) => {
            return {id: i, url: url.resolve(bookUrl, v)}
        })
        // book.chapters = book.chapters.slice(0, 2)
        const decoder = new StringDecoder('utf8');
        book.chapterParser = (chapterBody, resolve) => {
            let $2 = cheerio.load(chapterBody, {decodeEntities: false});
            let chapName = $2(site.chapterName).text().trim()
            let chap = $2(site.chapterText)
            //去除广告
            _.forEach(_.concat(site.chapterAds, ['script']), ad => {
                chap.find(ad).remove()
            })
            let chapHtml = chap.html()
            _.forEach(site.chapterAdsRe, ad => {
                chapHtml = chapHtml.replace(_.clone(ad), '')
            })


            let chapTxt = cheerio.load(chapHtml).text()
            resolve(chapName + '\n\n' + chapTxt)
        }
        book.downloadChapters().then(() => {
            book.toTxt()
        })
    })
}

/**
 * 分享网址，对应哪个网站配置
 * @param u
 */
function parseURL(u) {
    let myurl = new url.URL(u);
    switch (myurl.hostname) {
        case 'www.quanben.io':
            parserQuanbenIo(u);
            break
        case 'wap.44pq.com':
            parser44pq(u);
            break;
        default:
            let site = _.find(XsData, (s) => {
                if (_.isString(s.host)) {
                    return _.endsWith(myurl.hostname, s.host)
                }
                return s.host.indexOf(myurl.hostname) >= 0
            })
            if (site != null) {
                parserSite(site, u)
            } else {
                console.log("没有匹配的站点")
            }
            break;
    }
}

module.exports = {
    parseURL,
}
