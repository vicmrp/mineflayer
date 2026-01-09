require('dotenv').config()

const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const collectBlock = require('mineflayer-collectblock').plugin
const toolPlugin = require('mineflayer-tool').plugin
const { Vec3 } = require('vec3')

/* ───────── CONFIG ───────── */

const FOLLOW_DISTANCE = 3

const BOT_CONFIG = {
  host: process.env.MC_HOST,
  port: Number(process.env.MC_PORT),
  username: process.env.MC_USERNAME,
  auth: process.env.MC_AUTH,
  version: process.env.MC_VERSION
}

/* ───────────────────────── */

let bot

let followTarget = null

let farmingEnabled = true
let farmLoopRunning = false

let emptySince = null
let reconnectInterval = null

/* ───────── BOT CREATION ───────── */

function createBot () {
  bot = mineflayer.createBot(BOT_CONFIG)

  bot.loadPlugin(pathfinder)
  bot.loadPlugin(collectBlock)
  bot.loadPlugin(toolPlugin)

  registerHandlers()
}

createBot()

/* ───────── HELPERS ───────── */

const sleep = ms => new Promise(r => setTimeout(r, ms))

function humanPlayerCount () {
  return Object.values(bot.players).filter(p =>
    p.username !== bot.username && p.entity
  ).length
}

/* ───────── FARM LOGIC ───────── */

function isMatureCrop (block) {
  return (
    block &&
    ['wheat', 'carrots', 'potatoes'].includes(block.name) &&
    block.metadata === 7
  )
}

async function dumpToChest () {
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
  if (farmLoopRunning) return
  farmLoopRunning = true

  while (farmingEnabled) {
    try {
      // Don’t farm while following someone
      if (followTarget) {
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

  farmLoopRunning = false
}

/* ───────── FOLLOW LOOP ───────── */

async function followLoop () {
  if (!followTarget?.entity) return

  try {
    const targetPos = followTarget.entity.position

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

/* ───────── PLAYER WATCHDOG ───────── */

setInterval(() => {
  if (!bot?.entity) return

  const count = humanPlayerCount()

  if (!count) {
    emptySince ??= Date.now()
    if (Date.now() - emptySince > 60_000) {
      console.log('[BOT] No players for 60s, quitting')
      bot.quit()
    }
  } else {
    emptySince = null
  }
}, 5000)

/* ───────── RECONNECT ───────── */

function startReconnectLoop () {
  if (reconnectInterval) return
  reconnectInterval = setInterval(() => {
    console.log('[BOT] Reconnecting')
    createBot()
  }, 30_000)
}

/* ───────── HANDLERS ───────── */

function registerHandlers () {
  bot.once('spawn', async () => {
    emptySince = null
    reconnectInterval && clearInterval(reconnectInterval)
    reconnectInterval = null

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

    if (message === 'farm on') farmingEnabled = true
    if (message === 'farm off') farmingEnabled = false

    if (message === 'follow') {
      followTarget = bot.players[username]
      followLoop()
    }

    if (message === 'stop') {
      followTarget = null
      bot.pathfinder.setGoal(null)
    }
  })

  bot.on('end', startReconnectLoop)
  bot.on('error', console.error)
  bot.on('kicked', console.log)
}
