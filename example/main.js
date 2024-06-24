require('dotenv').config()
const OutageLabClient = require("../main")

let client = new OutageLabClient({
    application: "reviews-service",
    environment: process.env.ENVIRONMENT_NAME,
    apiKey: process.env.OUTAGELAB_API_KEY,
    host: "https://app.outagelab.com"
})
let cnt = 0

setInterval(async () => {
    ++cnt
    request("https://www.google.com/")
    request("https://vuetifyjs.com/en/components/data-tables/basics/#customization")
}, 1_000)

async function request(url) {
    try {
        const startTime = new Date()
        const result = await fetch(url)
        const duration = new Date() - startTime
        console.log(cnt, "GET", url, result.status, `${duration}ms`)
    } catch (ex) {
        console.log(`test client request to url '${url}' failed:`, ex)
    }
}
