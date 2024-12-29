const { BatchInterceptor } = require("@mswjs/interceptors");
const { FetchInterceptor } = require("@mswjs/interceptors/fetch");
const nodeInterceptors = require("@mswjs/interceptors/presets/node");

class OutageLabClient {
  constructor(options) {
    if (!options.apiKey) {
      console.warn(`outagelab: failed to start, no api key was provided`);
      return;
    }
    this._options = {
      host: "https://app.outagelab.com",
      ...(options || {}),
      refreshInterval: 5_000,
    };
    this._interceptor = new BatchInterceptor({
      name: "outagelab-interceptor",
      interceptors: [...nodeInterceptors.default, new FetchInterceptor()],
    });
    this.start();
  }

  _interceptor = null;
  _datapage = null;
  _options = null;
  _refreshIntervalId = null;

  start() {
    if (this._refreshIntervalId) {
      return;
    }

    this._refreshDatapage();

    this._refreshIntervalId = setInterval(
      this._refreshDatapage.bind(this),
      this._options.refreshInterval
    );

    this._interceptor.apply();
    this._interceptor.on("request", this._requestInterceptor.bind(this));
  }

  stop() {
    if (!this._refreshIntervalId) {
      return;
    }

    this._datapage = null;
    clearTimeout(this._refreshIntervalId);
    this._interceptor.removeAllListeners();
  }

  async _refreshDatapage() {
    let response = null;
    try {
      response = await fetch(`${this._options.host}/api/v1/datapage`, {
        method: "POST",
        headers: {
          "x-api-key": this._options.apiKey,
          ContentType: "application/json",
        },
        body: JSON.stringify({
          application: this._options.application,
          environment: this._options.environment,
        }),
      });

      this._datapage = await response.json();
    } catch (ex) {
      this._datapage = null;
      if (response) {
        console.log(
          `outagelab: data page request returned status ${response.status}`
        );
      } else {
        console.log(
          `outagelab: data page request failed with exception: ${ex}`
        );
      }
    }
  }

  async _requestInterceptor({ request, requestId }) {
    try {
      const host = new URL(request.url).host;
      let rule = null;
      for (let r of this._datapage?.rules || []) {
        if (r.type !== "http-client-request.v1") {
          continue;
        }
        if (r.httpClientRequestV1?.host === host) {
          rule = r.httpClientRequestV1;
          break;
        }
      }

      if (!rule) {
        return;
      }

      if (rule.duration || rule.status) {
        const duration = rule.duration || 0.1;
        await new Promise((resolve) => setTimeout(resolve, duration * 1000));
      }

      if (rule.status) {
        request.respondWith(new Response(null, { status: rule.status }));
      }
    } catch (ex) {
      console.error(
        `outagelab: internal error in HTTP request interceptor: ${ex}`
      );
    }
  }
}

module.exports = {
  start(options) {
    new OutageLabClient(options);
  },
};
