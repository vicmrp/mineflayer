const state = require('./state')
const { humanPlayerCount } = require('./helpers')

let watchdogInterval = null

function startPlayerWatchdog () {
  if (watchdogInterval) return

  watchdogInterval = setInterval(() => {
    const bot = state.bot
    if (!bot?.entity) return

    const count = humanPlayerCount()

    if (!count) {
      state.emptySince ??= Date.now()
      if (Date.now() - state.emptySince > 60_000) {
        console.log('[BOT] No players for 60s, quitting')
        bot.quit()
      }
    } else {
      state.emptySince = null
    }
  }, 5000)
}

module.exports = {
  startPlayerWatchdog
}
