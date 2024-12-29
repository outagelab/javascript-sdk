require("dotenv").config();

const outagelab = require("../main.js");

outagelab.start({
  application: "my-app",
  environment: process.env.ENVIRONMENT_NAME,
  apiKey: process.env.OUTAGELAB_API_KEY,
});

let cnt = 0;

setInterval(async () => {
  ++cnt;
  request("https://www.google.com/");
  request(
    "https://vuetifyjs.com/en/components/data-tables/basics/#customization"
  );
}, 1_000);

async function request(url) {
  try {
    const startTime = new Date();
    const result = await fetch(url);
    const duration = new Date() - startTime;
    console.log(cnt, "GET", url, result.status, `${duration}ms`);
  } catch (ex) {
    console.log(`test client request to url '${url}' failed:`, ex);
  }
}
