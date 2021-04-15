import requestAdapter from './request'
import CancelToken from './cancelToken'
import InterceptorManager from './interceptorManager'
import RequestQueue from './queue'

export default class XFetch {
  constructor (options, MPX) {
    this.CancelToken = CancelToken
    // this.requestAdapter = (config) => requestAdapter(config, MPX)
    // 当存在 useQueue 配置时，才使用 this.queue 变量
    if (options && options.useQueue && typeof options.useQueue === 'object') {
      this.queue = new RequestQueue({
        adapter: (config) => requestAdapter(config, MPX),
        ...options.useQueue
      })
    } else {
      this.requestAdapter = (config) => requestAdapter(config, MPX)
    }
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  create (options) {
    console.warn('The xfetch.create api is deprecated now and will be removed in next minor version!')
    return new XFetch(options)
  }

  lock () {
    console.warn('The xfetch.lock api is useless now and will be removed in next minor version!')
  }

  unlock () {
    console.warn('The xfetch.unlock api is useless now and will be removed in next minor version!')
  }

  addLowPriorityWhiteList (rules) {
    this.queue.addLowPriorityWhiteList(rules)
  }

  fetch (config, priority) {
    config.timeout = config.timeout || global.__networkTimeout
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = this.queue && (() => this.queue.request(config, priority))

    this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    chain.push(request || this.requestAdapter, undefined)

    this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }
}
