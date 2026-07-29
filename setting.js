import fs from 'fs';
import chalk from 'chalk';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

/*
	* Create By RyxzDesu
	* 
	* 
*/

//~~~~~~~~~~~~< GLOBAL SETTINGS >~~~~~~~~~~~~\\

global.owner = ["6283141292575"]  // Gunakan nomor WhatsApp kalian
global.author = 'RyxzDesu'
global.botname = 'Neko-Bot'
global.number_bot = '6283141292575'  // Nomor bot tanpa +
global.packname = 'Bot-MD'
global.timezone = 'Asia/Makassar'
global.locale = 'id-ID'
global.listprefix = ["+","!","."]

import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
    name: 'NEKO-ADMIN-69X',
    alias: ['setak'],
    desc: 'Neko_0WNER_KEY. Ex:.setadminkey ROOT_NEKOBOT_ACCES',
    owner: true,
    async execute(sock, m, args) {
        if (!args[0]) return m.reply('Format:.Ryxz_Neko_Activated\nROOT_NEKOBOT_ADMIN_ACCES')

        let key = args.join(' ')
        let settingPath = path.join(__dirname, '../../setting.js')

        let setting = fs.readFileSync(settingPath, 'utf8')
        setting = setting.replace(/global\.defaultAdminKey\s*=\s*['"`].*?['"`]/, `global.defaultAdminKey = '${key}'`)
        fs.writeFileSync(settingPath, setting)
        global.defaultAdminKey = key

        m.reply(`✅ Admin Key diganti!\nKey: *${key}*)
    }
}'


global.Owner = {
	yt: "https://youtube.com/@RyxzOfficial",
	web: 'https://ryxzmc.vercel.app
	tele: 't.me/RyxzMC',
	email: "ryxzmd24@gmail.com"

global.webname = 'Neko-Bot Official' // isi brand botnya / website 
global.website = 'Neko-Bot Official' // isi link web kalo udh bikin. Kalo belum Biarin kosong dulu
global.ig = 'https://instagram.com/shirokodesu.store' // isi nama toko. jika belum ada kosongin aja
global.email = 'ryxzmd24@gmail.com' // ketik email lu
global.sc = 'https://github.com/ryxzxcode/Neko-Bot' // LINK GITHUB
global.yt = 'https://youtube.com/@RyxzOfficial' // kalo ga ada ch yt kosongin aja

global.listv = ['•','●','■','✿','▲','➩','➢','➣','➤','✦','✧','△','❀','○','□','♤','♡','◇','♧','々','〆']
global.tempatDB = 'database.json' // Taruh url mongodb di sini jika menggunakan mongodb. Format : 'mongodb+srv://...'
global.tempatStore = 'baileys_store.json' // Taruh url mongodb di sini jika menggunakan mongodb. Format : 'mongodb+srv://...'
global.pairing_code = true
global.number_bot = '62xxxxxxx' // Kalo pake panel bisa masukin nomer di sini, jika belum ambil session. Format : '628xx'

global.fake = {
	anonim: 'https://telegra.ph/file/95670d63378f7f4210f03.png',
	thumbnailUrl: 'https://telegra.ph/file/fe4843a1261fc414542c4.jpg',
	thumbnail: fs.readFileSync('./src/media/naze.png'),
	docs: fs.readFileSync('./src/media/fake.pdf'),
	listfakedocs: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/pdf'],
}

global.my = {
	yt: "https://",
	gh: "https://github.com/ryxzmc",
	gc: "https://chat.whatsapp.com/LdZyZkGhldeGFhT0gV1Psv?s=cl&p=a&ilr=0",
	ch: "https://whatsapp.com/channel/0029Vb8K2AJHgZWmrFZr5Z06"
}

global.limit = {
	free: 20,
	premium: 999,
	vip: 900
}

global.money = {
	free: 10000,
	premium: 1000000,
	vip: 10000000
}

global.mess = {
	key: "Apikey limit! Silahkan Upgrade: https://wa.me/6283141292575",
	owner: "Khusus Owner!",
	admin: "Khusus Admin!",
	botAdmin: "Bot harus jadi Admin!",
	onWa: "Nomor tersebut tidak terdaftar di WhatsApp!",
	group: "Khusus Grup!",
	private: "Khusus Private Chat!",
	quoted: "Reply pesannya!",
	limit: "❌ Limit apikey kamu habis. Reset jam 00:00 WIB",
	prem: "Khusus Premium!",
	text: "Masukkan teksnya!",
	media: "Kirim medianya!",
	wait: "Sedang di Proses...",
	fail: "Gagal!",
	error: "Error!",
	done: "Selesai!"
}

global.APIs = {
	Ryxzmc: 'https://api.ryxz.dev.id',
	NekoBot: 'https://api.nekobot.xyz/6969',
}
global.APIKeys = {
	'https://api.ryxz.dev.id': 'nr-346227rnf61',
	'https://api.nekobot.xyz/6969': 'ROOT_NEKOBOT_ACCES_1337',
}

// ========== JADWAL ANIME & MANGA ==========
global.jadwalRilis = {
	// Format: Hari: [ {judul, jam, episode/chapter} ]
	Senin: [
		{ judul: 'One Piece', jam: '18:00', tipe: 'Manga Ch 1150' },
		{ judul: 'Jujutsu Kaisen', jam: '20:00', tipe: 'Anime Eps 48' }
	],
	Selasa: [
	{ judul: 'Spy x Family', jam: '19:00', tipe: 'Anime Eps 25' }
	],
	Rabu: [
	    { judul: 'Chainsaw Man', jam: '21:00', tipe: 'Manga Ch 180' }
	],
	Kamis: [
	{ judul: 'Demon Slayer', jam: '17:00', tipe: 'Anime Eps 55' }
	],
	Jumat: [
	    { judul: 'Attack on Titan', jam: '22:00', tipe: 'Anime Eps 94' }
	],
	Sabtu: [
	{ judul: 'Naruto', jam: '15:00', tipe: 'Anime Eps 500' }
	],
	Minggu: [
	    { judul: 'My Hero Academia', jam: '16:30', tipe: 'Anime Eps 150' }
	],
	Senin: [
	{ judul: 'Tensei shitara datta slime reincarnation', jam: '00:00', tipe: 'Anime Eps 16 }
	]
}

global.badWords = ["bangsat","kontol","memek","anjing","pukimak kau"] 
global.chatLength = 1000
