const mineflayer = require('mineflayer')
const { pathfinder } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const toolPlugin = require('mineflayer-tool').plugin
const state = require('./state')
const { BOT_CONFIG } = require('./config')
const { registerHandlers } = require('./handlers')
const { createStartReconnectLoop } = require('./reconnect')

function createBot () {
  state.bot = mineflayer.createBot(BOT_CONFIG)

  state.bot.loadPlugin(pathfinder)
  state.bot.loadPlugin(collectBlock)
  state.bot.loadPlugin(toolPlugin)

  registerHandlers(state.bot, { startReconnectLoop })
}

const startReconnectLoop = createStartReconnectLoop(createBot)

module.exports = {
  createBot
}
