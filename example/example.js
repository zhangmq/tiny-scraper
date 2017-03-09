const { createRouter, createScraper } = require('tiny-scraper');
const cheerio = require('cheerio');
const { on } = require('flyd');
const { request } = require('axios');
const { get, compose } = require('./utils');

const github = 'https://github.com';
const router = createRouter();
const matchGithub = router.match(github);
const toUrl = path => `${github}${path}`;

const parseList = res => {
  const $ = cheerio.load(res.data);
  const items = $('.js-navigation-item .content>span>a').toArray();
  const href = elem => $(elem).attr('href');

  return items.map(compose(get, toUrl, href));
}

const parseFileInfo = res => {
  const $ = cheerio.load(res.data);
  return $('.file-info').text().replace(/\s+/g, ' ');
}

matchGithub('/zhangmq/tiny-scraper', function* (req, res, params, query) {
  return parseList(res);
});

matchGithub('/zhangmq/tiny-scraper/tree/master/:folder*', function* (req, res, params, query) {
  console.log('folder', params.folder);
  return parseList(res);
});

matchGithub('/zhangmq/tiny-scraper/blob/master/:file*', function* (req, res, params, query) {
  const { file } = params;
  console.log('file', { file, info: parseFileInfo(res)});
});

const scraper = createScraper({
    maxRequest: 1,
    requestDuration: 3000,
    router,
    downloader: request
});

const { requestError$, routeError$ } = scraper;

on(error => console.log('download error', error), requestError$);
on(error => console.log('route error', error), routeError$);

scraper.task$([get('https://github.com/zhangmq/tiny-scraper')]);