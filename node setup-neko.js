import fs from 'fs'
import path from 'path'

const structure = {
  'package.json': '{"name":"neko-bot","version":"2.1.0","type":"module","main":"index.js","scripts":{"start":"node index.js"},"dependencies":{"@whiskeysockets/baileys":"^6.7.15","lowdb":"^7.0.1","node-fetch":"^3.3.2","openai":"^4.47.1","pino":"^9.3.2","chalk":"^5.3.0","axios":"^1.7.2","cheerio":"^1.0.0-rc.12"}}',
  
  '.env.example': 'PREFIX=.\nOWNER=628xxx@s.whatsapp.net\nOPENAI_KEY=sk-xxx\nDEEPSEEK_KEY=sk-xxx',
  
  '.gitignore': 'node_modules\nsession\ndatabase.json\n.env',
  
  'index.js': `import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB, resetLimit } from './src/lib/database.js'
import { messageHandler } from './src/lib/handler.js'
import chalk from 'chalk'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const prefix = process.env.PREFIX || '.'
let commands = {}
async function loadCommands() {
  const cmdPath = path.join(__dirname, 'src/commands')
  const files = fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))
  for(let file of files) {
    let cmd = (await import(\`./src/commands/\${file}\`)).default
    commands[cmd.name] = cmd
    cmd.alias?.forEach(a => commands[a] = cmd)
  }
  console.log(chalk.green(\`Neko-Bot Loaded \${files.length} commands\`))
}
setInterval(() => { let now = new Date(); if(now.getHours() == 0 && now.getMinutes() == 0) resetLimit() }, 60000)
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session')
  const { version } = await fetchLatestBaileysVersion()
  const db = await initDB()
  await loadCommands()
  const sock = makeWASocket({ version, logger: pino({ level: 'silent' }), printQRInTerminal: true, auth: state, browser: ['Neko-Bot', 'Chrome', '2.1.0'] })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (u) => { const { connection, lastDisconnect } = u; if(connection === 'close') { if(lastDisconnect.error?.output?.statusCode!= DisconnectReason.loggedOut) startBot() } else if(connection === 'open') { console.log(chalk.green('🐱 Neko-Bot Online!')) } })
  sock.ev.on('messages.upsert', async ({ messages }) => { await messageHandler(sock, messages[0], commands, db, prefix) })
}
startBot()`,
  
  'src/lib/database.js': `import { Low, JSONFile } from 'lowdb'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
const file = join(__dirname, '../../database.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)
export async function initDB() { await db.read(); db.data ||= { users: {}, chats: {}, settings: { owner: process.env.OWNER?.split(',') || [] }, stats: { cmd: 0 } }; await db.write(); return db }
export function getUser(jid) { db.data.users[jid] = db.data.users[jid] || { limit: 5, limitImg: 3, exp: 0, banned: false, afk: -1, afkReason: '' }; return db.data.users[jid] }
export function getChat(jid) { db.data.chats[jid] = db.data.chats[jid] || { antilink: false, antibot: false, antitagall: false, antitoxic: false, antivirtex: false, antitagsw: false, welcome: true }; return db.data.chats[jid] }
export async function addExp(jid, amount = 5) { getUser(jid).exp += amount; await db.write() }
export async function resetLimit() { for(let id in db.data.users) { db.data.users[id].limit = 5; db.data.users[id].limitImg = 3 } await db.write() }
export default db`,
  
  'src/lib/handler.js': `import { getUser, getChat, addExp } from './database.js'
export async function messageHandler(sock, m, commands, db, prefix) {
  if(!m.message || m.key.remoteJid == 'status@broadcast') return
  if(m.key.fromMe) return
  m.sender = m.key.participant || m.key.remoteJid
  m.isGroup = m.key.remoteJid.endsWith('@g.us')
  m.chat = m.key.remoteJid
  m.text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
  m.reply = (text) => sock.sendMessage(m.chat, {text}, {quoted: m})
  getUser(m.sender)
  if(m.isGroup) getChat(m.key.remoteJid)
  if(getUser(m.sender).banned) return m.reply('🚫 Kamu di ban owner. Gak bisa pake bot')
  if(!m.text.startsWith(prefix)) return
  let args = m.text.slice(prefix.length).trim().split(/ +/)
  let command = args.shift().toLowerCase()
  let cmd = commands[command]
  if(!cmd) return
  if(cmd.owner &&!db.data.settings.owner.includes(m.sender)) return m.reply('Khusus owner bang')
  if(cmd.group &&!m.isGroup) return m.reply('Fitur khusus grup')
  if(cmd.admin) { let metadata = await sock.groupMetadata(m.key.remoteJid); let isAdmin = metadata.participants.find(p => p.id == m.sender)?.admin; if(!isAdmin) return m.reply('Khusus admin grup') }
  let user = getUser(m.sender)
  if(cmd.limit && user.limit <= 0) return m.reply('Limit kamu abis. Reset jam 00:00 WIB\\nKetik.limit buat cek')
  try { await cmd.run(sock, m, args, { db, commands, prefix }); if(cmd.limit) user.limit--; await addExp(m.sender); db.data.stats.cmd++; await db.write() } catch(e) { console.log(e); m.reply('Error: ' + e.message) }
}`,
  
  'README.md': '# Neko-Bot 🐱\nBot WhatsApp full fitur Baileys + AI\n## Install\nnpm i\ncp .env.example .env\nnano .env\nnode index.js\n## Fitur\nAI Chat, AI Image, Games, Downloader, Anti, Owner tools, Broadcast\n\n## Owner Command\n.ban .unban .broadcast .bcgc .bcuser .ceklimit',
  
  'Dockerfile': 'FROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nCMD ["node", "index.js"]',
  
  'railway.json': '{"$schema":"https://railway.app/railway.schema.json","build":{"builder":"NIXPACKS"},"deploy":{"restartPolicyType":"ALWAYS","restartPolicyMaxRetries":10}}'
}

// Bikin semua file
for(let [filePath, content] of Object.entries(structure)) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
  console.log('Created:', filePath)
}
console.log('\n✅ Neko-Bot folder jadi! Sekarang copas 27 file command ke src/commands/')
