let handler = async (m, { conn, args }) => {
  let type = (args[0] || '').toLowerCase()
  if (!type) return m.reply(`Mau order apa kak?\n\nContoh:\n.order sewa\n.order panel\n.order script`)

  let teks = `Oke kak, mau order *${type}* ya?\n\nLangsung hubungi owner biar cepet diproses:\nwa.me/${global.owner[0][0]}?text=Halo%20kak%20mau%20order%20${type}\n\nAtau cek web: ${global.website}`

  await conn.sendMessage(m.chat, { text: teks }, { quoted: m })
}
handler.command = ['order','beli','buy']
handler.tags = ['store']
export default handler
