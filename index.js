const {parseURL} = require('./parser')
const readline = require('readline');


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