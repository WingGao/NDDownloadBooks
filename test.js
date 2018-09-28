const readline = require('readline');
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
const DEBUG = false //测试专用
const { XsData, Encoding } = require("./xsdata")
const {} = require('./index')


