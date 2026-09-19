// NEKO-BOT BY RYXZ - TINGGAL PAKE
import './setting.js'
import fs from 'fs'
import path from 'path'
import pino from 'pino'
import chalk from 'chalk'
import readline from 'readline'
import { Boom } from '@hapi/boom'
import { fileURLToPath } from 'url'
import { makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'

import { dataBase } from './src/database.js'
import { GroupParticipantsUpdate, MessagesUpsert, Solving } from './src/message.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

async function startNekoBot() {
  // DB
  const database = dataBase(global.tempatDB || 'database.json')
  const storeDB = dataBase('store.json')
  global.db = (await database.read()) || { users: {}, groups: {}, set: {}, premium: [], sewa: [], hit: {}, store: {} }
  global.store = (await storeDB.read()) || { contacts: {}, messages: {}, groupMetadata: {} }

  // Auth
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

  // Pairing Code
  if (!bot.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let number = (global.pairingNumber || global.number_bot || '').replace(/[^0-9]/g,'')
        let code = await bot.requestPairingCode(number)
        console.log(chalk.bgGreen.black(`\n PAIRING CODE: ${code} \n`))
        console.log(chalk.yellow(`Masukkan kode di WA anda > Perangkat Tertaut > Tautkan dengan nomor telepon`))
      } catch (e) {
        console.log(chalk.red('Gagal Pairing❎:', e.message))
      }
    }, 3000)
  }

  await Solving(bot, global.store)
  bot.ev.on('creds.update', saveCreds)

  bot.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log(chalk.green.bold(`✅ ${global.botname} Connected!`))
      console.log(chalk.cyan(`🌐 Web: ${global.website}`))
    }
    if (connection === 'close') {
      let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(chalk.red(`Connection closed: ${reason}`))
      if (reason !== DisconnectReason.loggedOut) startNekoBot()
      else {
        console.log(chalk.red('Session habis, hapus folder sessions'))
        fs.rmSync('sessions', { recursive: true, force: true })
      }
    }
  })

  bot.ev.on('messages.upsert', async (m) => MessagesUpsert(bot, m, global.store))
  bot.ev.on('group-participants.update', async (m) => GroupParticipantsUpdate(bot, m, global.store))

  // Auto save DB tiap 30 detik
  setInterval(async () => {
    await database.write(global.db).catch(()=>{})
    await storeDB.write(global.store).catch(()=>{})
  }, 30000)

  return bot
}

startNekoBot()
process.on('uncaughtException', e => console.error(e))
process.on('unhandledRejection', e => console.error(e))
