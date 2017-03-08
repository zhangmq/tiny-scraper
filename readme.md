# tiny-scraper
a simple scraper, friendly usage.

## Feature
* request will be queued, configurable request frequency and delay. 
* page parse logic can be customed base on url route.

## Dependencies
* flyd
* transducers.js
* path-to-regexp
* axios
* co

## Install
```
npm install tiny-scraper
```

## API
### createRouter
return a router to parse specified page.
```javascript
const { createRouter } = require('tiny-router');
const router = createRouter();
```
### router.match
match a site base uri, return a function to filter urls in this site. please refer to [path-to-regexp](https://github.com/pillarjs/path-to-regexp) document for route expression format. 
#### Parameters
* ***baseUri***  

```javascript
const matchGithub = router.match('https://github.com')

matchGithub(
  '/zhangmq/tiny-scraper',                //route expression
  function* (req, res, params, query) {
    yield storage(res.data)               //storage just for demo, you can implement it by yourself.
    return [/* parsed urls */];
  }
);
```
### createScraper
create a scraper.
#### Parameters
* ***options*** a object contains config fields.
  * ***maxRequest*** max requests count paralleled.
  * ***requestDuration*** min request duration, if request completed early, will wait until specified duration.
  * ***router*** you implemented router. 
```javascript
const { createScraper } = require('tiny-scraper');
const scraper = createScraper({
  maxRequest: 1,
  requestDuration: 2000,
  router
});

scraper.tasks$([/* seed tasks */])
```

### scraper.tasks$
task input stream. you can send seed url or resend failed request into this steam.
#### Parameters
* ***input*** a array of request config. please refer to [axios](https://github.com/mzabriskie/axios) document. 
### scraper.requestError$
failed request stream.
### scraper.routeError$
route execute error. you can debug you route code by this scream.

## Demo
[example](./example/example.js)