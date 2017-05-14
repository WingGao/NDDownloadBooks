const readline = require('readline');
const url = require('url');
const _ = require('lodash');
let fetch = require('node-fetch');

class Book {
    constructor(){
        this.name = ''
        this.author = ''
    }
}


// http://www.quanben.io
function parserQuanbenIo(u) {
    if(_.endsWith(u,'list.html')){
        u = u+'list.html'
    }
    fetch(u).then((res)=>res.text()).then(body=>{
        debugger
    })
}

function parseURL(u) {
    let myurl = new url.URL(u);
    switch (myurl.hostname){
        case 'www.quanben.io':
            parserQuanbenIo(u);
            break
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if(process.argv.length >= 3){
    parseURL(process.argv[2])
}else {
    rl.question('书籍地址: ', (answer) => {
        //http://www.quanben.io/n/jianshen/list.html
        parseURL(answer)
        // TODO: Log the answer in a database
        console.log(`Thank you for your valuable feedback: ${answer}`);
        rl.close();
    });
}