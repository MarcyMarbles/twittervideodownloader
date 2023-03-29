const { TwitterVideoDownloader } = require('./twitter.js');
const {unlink, writeFile} = require('fs');

const url = 'https://twitter.com/i/status/1626759413045272577';

const downloader = new TwitterVideoDownloader(url);
downloader.Download(5000000) // Максимальный размер файла
