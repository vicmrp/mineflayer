require('dotenv').config()

const { createBot } = require('./src/createBot')
const { startPlayerWatchdog } = require('./src/watchdog')

createBot()
startPlayerWatchdog()
