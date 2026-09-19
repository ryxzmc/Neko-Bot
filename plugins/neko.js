let handler = async (m, { conn, text }) => {
  // Trigger: neko, neko-bot, menu, harga, p, bot
  const trigger = /^(neko|nekobot|neko-bot|menu|harga|p|bot|ryxz)$/i
  if (!trigger.test(m.text?.toLowerCase().trim())) return

  const isGroup = m.isGroup
  const jid = m.chat
  const name = m.pushName || 'Kak'

  const info = `
╭───〔 *NEKO-BOT 🤖* 〕───
│ Hai ${name} ✨
│ Aku Neko-Bot CS dari RyxzMC
│
│ *Status:* Online 🟢
│ *Web:* ryxzmc.vercel.app
│ *Owner:* wa.me/${global.owner[0][0]}
╰─────────────────

┏━━〔 *MENU JUALAN* 〕━━⬣
┃
┃ 🛒 *LIST HARGA*
┃ • Sewa Bot Harian - 3k
┃ • Sewa Bot Mingguan - 10k
┃ • Sewa Bot Bulanan - 25k
┃ • Panel Ptero 1GB - 5k
┃ • Script Neko-Bot No Enc - 15k
┃
┃ 📦 *CARA ORDER*
┃ Ketik: .order sewa / .order panel
┃ Atau langsung chat owner
┃
┗━━━━━━━━━━━━━━━━⬣

Website resmi cek di bawah ya 👇
`.trim()

  await conn.sendMessage(jid, {
    text: info,
    contextInfo: {
      externalAdReply: {
        title: 'Neko-Bot Official Store',
        body: 'Klik untuk buka website',
        thumbnailUrl: global.fake.thumbnailUrl,
        sourceUrl: global.website,
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })

  // Kalau di grup, jangan spam, cukup mention aja
  if (isGroup) {
    await conn.sendMessage(jid, { text: `Butuh bantuan? Chat private aja kak @${m.sender.split('@')[0]} ✨`, mentions: [m.sender] })
  }
}

// Biar kepanggil tanpa prefix ! / . dan bisa di grup
handler.customPrefix = /^(neko|nekobot|neko-bot|menu|harga|p|bot|ryxz)$/i
handler.command = new RegExp
handler.all = false

export default handler
