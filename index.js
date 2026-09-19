// NEKO-BOT FIX - SUPPORT setting.js
import './settings.js'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import chalk from 'chalk'
import { Boom } from '@hapi/boom'
import { fileURLToPath } from 'url'
import { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'

import { dataBase } from './src/database.js'
import { GroupParticipantsUpdate, MessagesUpsert, Solving } from './src/message.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function startNekoBot() {
  // Load DB - support nama lama & baru
  const dbName = global.tempatDB || global.tempatStore || 'database.json'
  const database = dataBase(dbName)
  const storeDB = dataBase('store.json')

  global.db = (await database.read()) || { users: {}, groups: {}, set: {}, premium: [], sewa: [], hit: {}, store: {} }
  global.store = (await storeDB.read()) || { contacts: {}, messages: {}, groupMetadata: {} }

  const { version } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('sessions')

  const bot = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Chrome'),
    auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
    getMessage: async (key) => {
      let m = global.store?.messages?.[key.remoteJid]?.array?.find(x => x.key.id === key.id)
      return m?.message || { conversation: 'Neko-Bot' }
    }
  })

  // Pairing Code - ngambil dari settings.js kamu
  if (!bot.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let number = (global.pairingNumber || global.pairing_code || global.number_bot || global.owner?.[0]?.[0] || '').replace(/[^0-9]/g,'')
        if(!number) number = "6283141292575"
        let code = await bot.requestPairingCode(number)
        console.log(chalk.bgGreen.black(`\n PAIRING CODE BUAT ${number}: ${code} \n`))
        console.log(chalk.yellow(`Buka WA > Perangkat Tertaut > Tautkan dengan nomor`))
      } catch (e) {
        console.log(chalk.red('Gagal pairing:', e.message))
      }
    }, 3000)
  }

  await Solving(bot, global.store)
  bot.ev.on('creds.update', saveCreds)

  bot.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log(chalk.green.bold(`✅ ${global.botname || 'Neko-Bot'} Connected!`))
    }
    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(chalk.red(`Closed: ${reason}`))
      if (reason!== DisconnectReason.loggedOut) startNekoBot()
      else {
        fs.rmSync('sessions', { recursive: true, force: true })
        console.log('Session logout, hapus sessions dan start lagi')
      }
    }
  })

  bot.ev.on('messages.upsert', async (m) => MessagesUpsert(bot, m, global.store))
  bot.ev.on('group-participants.update', async (m) => GroupParticipantsUpdate(bot, m, global.store))

  setInterval(async () => {
    await database.write(global.db).catch(()=>{})
    await storeDB.write(global.store).catch(()=>{})
  }, 30000)

  return bot
}

startNekoBot()
process.on('uncaughtException', e => console.error(e))
process.on('unhandledRejection', e => console.error(e))
