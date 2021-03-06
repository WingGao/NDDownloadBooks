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
    {
        name: '手机看书',
        host: 'shoujikanshu.cc', // http://m.ldw.la 手机版有搜索
        encode: Encoding.GBK,
        search: 'http://www.shoujikanshu.cc/book/keyname.php?q=%s&searchtype=title',
        bookName: '.box-artic h1',
        bookAuthor: '',
        chapterList: '.list a',
        chapterUrlReg: /^[0-9_]+\.html$/,
        chapterName: '',
        chapterText: '.content',
        chapterAds: ['.addresses'],
        chapterAdsRe: [],
        proxy: true,
    },
    {
        name: '飞舞',
        host: 'www.fwtxt.org',
        encode: Encoding.GBK,
        search: '',
        bookName: '#thread_subject',
        bookAuthor: '',
        chapterList: '.mz_reader_catelog a',
        chapterUrlReg: /mz_reader-mzreader\.html\?tid=\d+&aid=\d+&page=(\d+)$/,
        chapterName: '',
        chapterText: '#txt_content',
        chapterAds: [],
        chapterAdsRe: [],
        proxy: true,
    },
    {
        name: '草榴',
        // host: 'w.xiaocao.ze.cx',
        host: 't66y.com',
        encode: Encoding.GBK,
        // cookies: 'ismob=1',
        search: '',
        bookName: 'form[name="delatc"] th.h',
        bookAuthor: '',
        chapterUrlPageFirst: 1, //首页
        chapterUrlPageLastReg: /href="([^"]+page=(\d+))" id="last"/, //页数
        chapterUrlPageNumRegT: '&page=\\d+',//页数模式
        chapterName: '',
        chapterText: '.tpc_content',
        chapterAds: [],
        chapterAdsRe: [],
        proxy: true,
    },
]

module.exports = {
    XsData: data,
    Encoding,
}
