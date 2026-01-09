const { goals } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
const state = require('./state')
const { sleep } = require('./helpers')

function isMatureCrop (block) {
  return (
    block &&
    ['wheat', 'carrots', 'potatoes'].includes(block.name) &&
    block.metadata === 7
  )
}

async function dumpToChest () {
  const bot = state.bot
  if (!bot) return

  const chestBlock = bot.findBlock({
    matching: b => b.name === 'chest',
    maxDistance: 6
  })
  if (!chestBlock) return

  const chest = await bot.openChest(chestBlock)

  for (const item of bot.inventory.items()) {
    if (['wheat', 'carrot', 'potato', 'wheat_seeds'].includes(item.name)) {
      await chest.deposit(item.type, null, item.count)
    }
  }

  chest.close()
}

async function farmLoop () {
  if (state.farmLoopRunning) return
  state.farmLoopRunning = true

  while (state.farmingEnabled) {
    const bot = state.bot
    if (!bot) break

    try {
      // Don’t farm while following someone
      if (state.followTarget) {
        await sleep(2000)
        continue
      }

      const crops = bot.findBlocks({
        matching: isMatureCrop,
        maxDistance: 6,
        count: 32
      })

      if (!crops.length) {
        await sleep(8000)
        continue
      }

      for (const pos of crops) {
        const crop = bot.blockAt(pos)
        if (!crop) continue

        await bot.pathfinder.goto(new goals.GoalBlock(pos.x, pos.y, pos.z))

        await bot.tool.equipForBlock(crop)
        await bot.dig(crop)

        const soil = bot.blockAt(pos.offset(0, -1, 0))
        if (!soil) continue

        const seed = bot.inventory.items().find(i =>
          ['wheat_seeds', 'carrot', 'potato'].includes(i.name)
        )

        if (seed) {
          await bot.equip(seed, 'hand')
          await bot.placeBlock(soil, new Vec3(0, 1, 0))
        }

        await sleep(250)
      }

      await dumpToChest()
    } catch (err) {
      console.error('[FARM]', err.message)
    }

    await sleep(4000)
  }

  state.farmLoopRunning = false
}

module.exports = {
  farmLoop
}
