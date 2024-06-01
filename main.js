const { BatchInterceptor } = require('@mswjs/interceptors')
const { FetchInterceptor } = require('@mswjs/interceptors/fetch')
const nodeInterceptors = require('@mswjs/interceptors/presets/node')

module.exports = class OutageLabClient {
    constructor(options) {
        this._options = {
            refreshInterval: 60_000,
            datapageHost: "https://app.outagelab.com",
            ...(options || {})
        }
        this._interceptor = new BatchInterceptor({
            name: 'outagelab-interceptor',
            interceptors: [...nodeInterceptors.default, new FetchInterceptor()],
        })
        this._interceptor.apply()
        this._interceptor.on('request', async ({ request, requestId }) => {
            try {
                if (request.url.startsWith(this._options.datapageHost)) {
                    return
                }

                // all needs refactoring with reduced data model
                const app = this._datapage?.applications?.find(x => x.id === this._options.application)
                const enabled = app?.environments?.find(x => x.id === this._options.environment)?.enabled

                if (!enabled) {
                    return
                }

                const host = new URL(request.url).host
                const rule = app?.rules?.find(x => x.enabled && x.host === host)
                if (!rule) {
                    return
                }

                if (rule.duration || rule.status) {
                    const duration = rule.duration || 0.1
                    await new Promise(resolve => setTimeout(resolve, duration * 1000))
                }

                if (rule.status) {
                    request.respondWith(new Response(null, { status: rule.status }))
                }
            } catch (ex) {
                console.log(ex)
            }
        })
        this.start()
    }

    _interceptor = null
    _datapage = null
    _options = null
    _refreshIntervalId = null

    start() {
        if (this._refreshIntervalId) {
            return
        }

        this._refreshIntervalId = setInterval(
            this._refreshDatapage.bind(this),
            this._options.refreshInterval
        )
        this._refreshDatapage()
    }

    stop() {
        if (!this._refreshIntervalId) {
            return
        }

        this._datapage = null
        clearTimeout(this._refreshIntervalId)
    }

    async _refreshDatapage() {
        try {
            this._datapage = await fetch(`${this._options.datapageHost}/datapage`, {
                method: "POST",
                headers: {
                    "x-api-key": this._options.apiKey,
                    "ContentType": "application/json"
                },
                body: JSON.stringify({
                    application: this._options.application,
                    environment: this._options.environment,
                })
            }).then(x => x.json())
        } catch (ex) {
            this._datapage = null
            console.log('Fault data refresh error:', ex)
        }
    }
}
