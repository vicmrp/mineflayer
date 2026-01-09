const state = require('./state')

function createStartReconnectLoop (createBot) {
  return function startReconnectLoop () {
    if (state.reconnectInterval) return

    state.reconnectInterval = setInterval(() => {
      console.log('[BOT] Reconnecting')
      createBot()
    }, 30_000)
  }
}

module.exports = {
  createStartReconnectLoop
}
