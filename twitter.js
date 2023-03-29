const { URLSearchParams } = require('url');
const axios = require('axios');
require('crypto');
const exec = require('child_process').exec;
const fs = require('fs');
const os = require('os');
const path = require('path');
require('url');
const rgxBearer = /"Bearer.*?"/;
const rgxNum = /[0-9]+/;
const rgxAddress = /https.*m3u8/;
const rgxFormat = /.*m3u8/;

class TwitterVideoDownloader {
    constructor(url) {
        this.VideoUrl = url;
    }

    async GetBearerToken() {
        const {data} = await axios.get('https://abs.twimg.com/web-video-player/TwitterVideoPlayerIframe.cefd459559024bfb.js');
        this.BearerToken = rgxBearer.exec(data)[0].replace(/"/g, '');
        return this.BearerToken;
    }

    async GetXGuestToken() {
        const params = new URLSearchParams();
        params.append('scribeContext', JSON.stringify({client: 'web'}));
        const {data} = await axios.post('https://api.twitter.com/1.1/guest/activate.json', params, {
            headers: {
                'Authorization': this.BearerToken,
                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
        });
        this.GuestToken = rgxNum.exec(data);
        return this.GuestToken;
    }

    async GetM3U8Urls() {
        const {data} = await axios.get(`https://api.twitter.com/1.1/videos/tweet/config/${this.VideoUrl.replace('https://twitter.com/i/status/', '')}.json`, {
            headers: {
                'Authorization': this.BearerToken,
                'x-guest-token': this.GuestToken,
            },
        });
        this.M3u8Urls = rgxAddress.exec(data.track.playbackUrl)[0].replace(/\\/g, '');
        return this.M3u8Urls;
    }

    async GetM3U8Url(m3u8Urls) {
        const {data} = await axios.get(m3u8Urls);
        const m3u8_urls = data.match(rgxFormat);
        this.M3u8Url = `https://video.twimg.com${m3u8_urls[m3u8_urls.length - 1]}`;
        return this.M3u8Url;
    }

    async Download(downloadBytesLimit) {
        await this.GetBearerToken();
        await this.GetXGuestToken();
        const m3u8Urls = await this.GetM3U8Urls();
        const m3u8Url = await this.GetM3U8Url(m3u8Urls);
        const filename = `output.mp4`;


        const file = fs.createWriteStream(path.join(os.tmpdir(), filename));

        return new Promise((resolve, reject) => {
            file.end();
            exec(`ffmpeg -i ${m3u8Url} -c copy ${filename}`, (err) => {
                if (err) {
                    reject(err);
                }
                fs.readFile(path.join(os.tmpdir(), filename), (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                });
            });
        });
    }
}

module.exports = {
    TwitterVideoDownloader,
};