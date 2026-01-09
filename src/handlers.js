const { Movements } = require('mineflayer-pathfinder')
const state = require('./state')
const { farmLoop } = require('./farm')
const { followLoop } = require('./follow')

function registerHandlers (bot, { startReconnectLoop }) {
  bot.once('spawn', async () => {
    state.emptySince = null
    if (state.reconnectInterval) {
      clearInterval(state.reconnectInterval)
      state.reconnectInterval = null
    }

    const mcData = require('minecraft-data')(bot.version)
    const movements = new Movements(bot, mcData)
    movements.allowParkour = true
    movements.allowSprinting = true

    bot.pathfinder.setMovements(movements)

    bot.chat('Bot online.')
    farmLoop()
  })

  bot.on('chat', async (username, message) => {
    if (username === bot.username) return

    if (message === 'farm on') state.farmingEnabled = true
    if (message === 'farm off') state.farmingEnabled = false

    if (message === 'follow') {
      state.followTarget = bot.players[username]
      followLoop()
    }

    if (message === 'stop') {
      state.followTarget = null
      bot.pathfinder.setGoal(null)
    }
  })

  bot.on('end', startReconnectLoop)
  bot.on('error', console.error)
  bot.on('kicked', console.log)
}

module.exports = {
  registerHandlers
}
