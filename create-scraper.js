const { stream, on, merge, combine, scan } = require('flyd');
const filter = require('flyd/module/filter');
const flatMap = require('flyd/module/flatmap');
const axios = require('axios');

const request = downloader => (config, duration = 0) => {
  const output$ = stream();
  
  const get = downloader(config)
    .then(response => ({ config, response }))
    .catch(error => ({ config, error }));

  const delay = new Promise(resolve => setTimeout(() => resolve('delayed'), duration));

  Promise.all([get, delay])
    .then(([result]) => output$(result))
    .then(() => output$.end(true));

  return output$;
}

module.exports = ({ maxRequest, requestDuration, router, downloader }) => {
  const task$ = stream();
  const requestProxy$ = stream();

  const requestByDownloader = request(downloader);
  
  const response$ = flatMap(config => requestByDownloader(config, requestDuration), requestProxy$);
  
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

