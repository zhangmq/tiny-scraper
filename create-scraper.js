const { stream, on, merge, combine, scan } = require('flyd');
const filter = require('flyd/module/filter');
const flatMap = require('flyd/module/flatmap');
const axios = require('axios');

const request = (config, duration = 0) => {
  const output$ = stream();
  
  const get = axios.request(config)
    .then(response => ({ config, response }))
    .catch(error => ({ config, error }));

  const delay = new Promise(resolve => setTimeout(() => resolve('delayed'), duration));

  Promise.all([get, delay]).then(([result]) => output$(result));

  return output$;
}

module.exports = ({ maxRequest, requestDuration, customRequest, router }) => {
  const task$ = stream();
  const requestProxy$ = stream();
  
  const response$ = flatMap(config => request(config, requestDuration), requestProxy$);
  
  const buffer$ = scan(
    (state, action) => action(state),
    [],
    merge(
      task$.map(list => state => [ ...state, ...list ]),
      requestProxy$.map(config => state => state.filter(item => item !== config))
    )
  );
  
  const running$ = scan(
    (state, action) => action(state), 
    [],
    merge(
      requestProxy$.map(config => state => [ ...state, config ]),
      response$.map(({ config }) => state => state.filter(item => item !== config))
    )
  );
  
  const prepare$ = buffer$.map(buffer => buffer.length ? buffer[0] : null);
  
  const request$ = combine((prepare, running, self) => {
    if (prepare() !== null && running().length < maxRequest) {
      self(prepare());
    }
  }, [prepare$, running$]);
  
  const requestSucc$ = filter(({ error }) => !error, response$);
  const requestError$ = filter(({ error }) => error, response$);

  const routeResult$ = flatMap(router, requestSucc$);
  const routeError$ = filter(({ error }) => error, routeResult$);
  const internalTask$ = filter(({ error }) => !error, routeResult$)
    .map(result => result.tasks || []);

  on(config => requestProxy$(config), request$);
  on(list => task$(list), internalTask$);

  return {
    task$,
    running$,
    requestError$,
    routeError$
  }
}

