const VERSION = 1
const Encoding = {
    UTF8: 0,
    GBK: 1,
}

const data = [
    {
        name: '166小说',
        host: 'www.166xs.com',
        encode: Encoding.GBK,
        search: 'http://zhannei.baidu.com/cse/search?s=4838975422224043700&q=%s',
        bookName: '#theme_book .title h1',
        bookAuthor: '#theme_book .author a',
        chapterList: 'dl.book_list dd > a',
        chapterUrlReg: /^\d+\.html$/u,
        chapterName: '#Text h2',
        chapterText: '#Text .Book_Text',
        //章节中的广告
        chapterAds: ['.Banner', '.Book_Hot'],
        chapterAdsRe: [/166小说阅读网/gu],
    }
]

module.exports.XsData = data