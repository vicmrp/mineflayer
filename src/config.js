const FOLLOW_DISTANCE = 3

const BOT_CONFIG = {
  host: process.env.MC_HOST,
  port: Number(process.env.MC_PORT),
  username: process.env.MC_USERNAME,
  auth: process.env.MC_AUTH,
  version: process.env.MC_VERSION
}

module.exports = {
  FOLLOW_DISTANCE,
  BOT_CONFIG
}
