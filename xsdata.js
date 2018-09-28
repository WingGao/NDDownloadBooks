const VERSION = 1
const Encoding = {
    UTF8: 0,
    GBK: 1,
}
/**
 * 配置项
 *
 *      chapterList: (selector) 表示章节连接，一般是a标签
 *      proxy: (bool) 是否使用代理
 *
 * @type {*[]}
 */
const data = [
    {
        name: '166小说',
        host: 'www.166xs.com',
        encode: Encoding.GBK,
        search: 'http://zhannei.baidu.com/cse/search?s=4838975422224043700&q=%s',
        bookName: '#theme_book .title h1', // selector 或者 reg
        bookAuthor: '#theme_book .author a',
        chapterList: 'dl.book_list dd > a',
        chapterUrlReg: /^\d+\.html$/u,
        chapterName: '#Text h2',
        chapterText: '#Text .Book_Text',
        //章节中的广告
        chapterAds: ['.Banner', '.Book_Hot'],
        chapterAdsRe: [/166小说阅读网/gu],
    },
    {
        name: '灵域小说网',
        host: 'www.lingyutxt.com',
        encode: Encoding.GBK,
        search: '',
        bookName: '#maininfo h1',
        bookAuthor: /<meta name="author" content="([^"]+)"/u,
        chapterList: '#list dd > a',
        chapterUrlReg: /^\d+\.html$/,
        chapterName: '.box_con > .bookname h1',
        chapterText: '#content',
        chapterAds: [],
        chapterAdsRe: [],
    },
    {
        name: '乐读窝',
        host: 'ldw.la', // http://m.ldw.la 手机版有搜索
        encode: Encoding.GBK,
        search: '',
        bookName: '#box h1',
        bookAuthor: '#info a:first-child',
        chapterList: 'body > table a',
        chapterUrlReg: /^\d+\.html$/,
        chapterName: '#box h1',
        chapterText: '#content',
        chapterAds: [],
        chapterAdsRe: [],
        proxy: true,
    },
]

module.exports = {
    XsData: data,
    Encoding,
}
