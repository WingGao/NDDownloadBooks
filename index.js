const readline = require('readline');
const url = require('url');
const _ = require('lodash');
let fetch = require('node-fetch');
const cheerio = require('cheerio')
let FormData = require('form-data');
const path = require('path');
const fs = require('fs');
const Iconv = require('iconv').Iconv;
const iconv = new Iconv('GBK', 'UTF-8//TRANSLIT//IGNORE');
const DEBUG = false
const { XsData } = require("./xsdata")

class Book {
    constructor() {
        this.name = ''
        this.author = ''
        this.url = ''
        //{id:0, url:'', text:null}
        this.chapters = []
        this.chapterParser = null
        this.outDir = path.join(__dirname, 'out')
        this.iconv = null
    }

    getFileName() {
        return `《${this.name}》 作者：${this.author}`
    }

    formatChapter(chapterText) {
        return chapterText.replace(/&nbsp;/ig, ' ').replace(/<p>/ig, '').replace(/<\/p>|<br>/ig, '\n')
    }

    asyncDownloadChapert(chapter) {
        return new Promise((resolve, reject) => {
            fetch(chapter.url).then(res => res.text()).then(body => {
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
            book.chapters.push({ id: i, url: url.resolve(bookUrl, domA.attribs.href) })
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
            book.chapters.push({ id: i, url: url.resolve(bookUrl, domA.attribs.href) })
        })
        // book.chapters = book.chapters.slice(0, 2)
        book.chapterParser = (chapterBody, resolve) => {
            let $2 = cheerio.load(chapterBody, { decodeEntities: false });
            let chapName = $2('#nr_title').text().replace(/(第.+章)/gu, '$1  ')
            let chap = $2('#txt').html()
            resolve(chapName + '\n\n' + chap)
        }
        book.downloadChapters().then(() => {
            book.toTxt()
        })
    })
}

function parserSite(site, bookUrl) {
    let book = new Book();
    book.url = bookUrl
    fetch(bookUrl).then((res) => res.text()).then(body => {
        let $ = cheerio.load(body);
        book.name = $(site.bookName).text().trim();
        book.author = $(site.bookAuthor).text().trim();
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
        book.chapters = _.map(_.uniq(chapters).sort(), (v, i) => {
            return { id: i, url: url.resolve(bookUrl, v) }
        })
        // book.chapters = book.chapters.slice(0, 2)
        book.chapterParser = (chapterBody, resolve) => {
            let $2 = cheerio.load(chapterBody, { decodeEntities: false });
            let chapName = $2(site.chapterName).text().trim()
            let chap = $2(site.chapterText)
            //去除广告
            _.forEach(_.concat(site.chapterAds, ['script']), ad => {
                chap.find(ad).remove()
            })
            let chapTxt = chap.html()
            _.forEach(site.chapterAdsRe, ad => {
                chapTxt = chapTxt.replace(_.clone(ad), '')
            })
            resolve(chapName + '\n\n' + chapTxt)
        }
        book.downloadChapters().then(() => {
            book.toTxt()
        })
    })
}

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
                    return s.host === myurl.hostname
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

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


if (process.argv.length >= 3) {
    parseURL(process.argv[2])
} else {
    rl.question("选项\n\t1) 搜索\n\t2) 下载\n", (a1) => {
        rl.close()
        switch (a1) {
            case '1':
                rl.question('书名: ', (answer) => {
                    rl.close();
                });
                break;
            case '2':
                rl.question('书籍地址: ', (answer) => {
                    //http://www.quanben.io/n/jianshen/list.html
                    parseURL(answer)
                    // TODO: Log the answer in a database
                    console.log(`Thank you for your valuable feedback: ${answer}`);
                    rl.close();
                });
                break;
        }
    })
}