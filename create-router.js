const { stream } = require('flyd');
const pathToRegexp = require('path-to-regexp');
const t = require('transducers.js');
const co = require('co');

const toParams = (keys, matched) => {
  const [ _, ...values ] = matched;
  return keys.reduce(
    (prev, item, index) => Object.assign({}, prev, { [item.name]: values[index] }),
    {}
  );
}

const match = path => ({ pattern, keys, callback, baseUri }) => {
  const relativePath = path.indexOf(baseUri) >= 0 
    ? path.slice(baseUri.length) 
    : null;

  if (!relativePath) return null;
  
  const matched = pattern.exec(relativePath);
  return matched
    ? { params: toParams(keys, matched), callback }
    : null;
}

module.exports = function createRouter() {
  const routes = [];
  
  const router = ({ config, response }) => {
    const output$ = stream();
    const url = decodeURI(config.url);
    const [ path, query ] = url.split('?');

    if (!path) {
      console.log(`${path} invalid.`);
      process.nextTick(() => output$.end(true));
      return output$;
    }

    const matchPath = match(path);
    const [ matched ] = t.toArray(routes, t.compose(
      t.map(matchPath),
      t.filter(d => d !== null),
      t.take(1)
    ));

    if (!matched) {
      console.log(`${path} not match any routes.`);
      process.nextTick(() => output$.end(true));
      return output$;
    }

    co(matched.callback(config, response, matched.params, query))
      .then(result => output$({ tasks: result }))
      .catch(error => output$({ error }))
      .then(() => output$.end(true));

    return output$;
  }

  router.match = baseUri => (path, callback) => {
    const keys = [];
    const pattern = pathToRegexp(path, keys);
    
    routes.push({
      baseUri,
      pattern,
      keys,
      callback
    });
  }

  return router;
}