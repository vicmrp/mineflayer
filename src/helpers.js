const state = require('./state')

const sleep = ms => new Promise(r => setTimeout(r, ms))

function humanPlayerCount () {
  const bot = state.bot
  if (!bot) return 0

  return Object.values(bot.players).filter(p =>
    p.username !== bot.username && p.entity
  ).length
}

module.exports = {
  sleep,
  humanPlayerCount
}
