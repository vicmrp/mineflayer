const { goals } = require('mineflayer-pathfinder')
const state = require('./state')
const { FOLLOW_DISTANCE } = require('./config')

async function followLoop () {
  const bot = state.bot
  if (!bot || !state.followTarget?.entity) return

  try {
    const targetPos = state.followTarget.entity.position

    // Just walk near the player (no teleport / no OP needed)
    bot.pathfinder.setGoal(
      new goals.GoalNear(
        targetPos.x,
        targetPos.y,
        targetPos.z,
        FOLLOW_DISTANCE
      ),
      true
    )
  } catch (err) {
    console.error('[FOLLOW]', err.message)
  }

  setTimeout(followLoop, 1000)
}

module.exports = {
  followLoop
}
