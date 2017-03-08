const compose = (...fns) => input => 
  fns.reduceRight((prev, fn) => fn(prev), input);
const get = url => ({ method: 'get', url: encodeURI(url) });

module.exports = {
  compose,
  get
}
