const OutageLabClient = require("../main")

let client = new OutageLabClient({
    application: "reviews-service",
    environment: "staging",
    apiKey: "fake"
})
let cnt = 0

setInterval(async () => {
    request("https://en.wikipedia.org/w/api.php?action=parse&section=0&prop=text&format=json&page=Apple")
    request("https://www.google.com/")
    request("https://vuetifyjs.com/en/components/data-tables/basics/#customization")
}, 1_000)

async function request(url) {
    try {
        const startTime = new Date()
        const result = await fetch(url)
        const duration = new Date() - startTime
        console.log(++cnt, "GET", url, result.status, `${duration}ms`)
    } catch (ex) {
        console.log(ex)
    }
}
