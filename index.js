const express = require("express");
const redis = require("redis");
const axios = require("axios");

const redisUrl = "redis://127.0.0.1:6379";
const client = redis.createClient(redisUrl);

// client.set = util.promisify(client.set);

(async () => {
  await client.connect();
})();

client.on("connect", () => console.log("Redis Client Connected"));
client.on("error", (err) => console.log("Redis Client Connection Error", err));

const app = express();
app.use(express.json());

app.get("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const cachedPost = await client.get(`post-${id}`);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/posts/${id}`
    );
    client.set(`post-${id}`, JSON.stringify(data), "EX", 5000);

    return res.json(data);
  } catch (error) {
    res.json(`get post (error):", ${error}`);
  }
});

app.post("/", async (req, res) => {
  const { key, value } = req.body;
  const response = await client.set(key, value);
  res.json(response);
});

app.get("/", async (req, res) => {
  const { key } = req.body;
  const data = await client.get(key);
  res.json(data);
});

app.listen(8080, () =>
  console.log("server is running, listening on port 8080")
);
