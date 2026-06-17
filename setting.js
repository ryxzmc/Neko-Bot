import fs from 'fs';
import chalk from 'chalk';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

/*
	* Create By Ryxz
	* 
	* 
*/

//~~~~~~~~~~~~< GLOBAL SETTINGS >~~~~~~~~~~~~\\

global.owner = ["62xxxxxxx"]  // Gunakan nomor WhatsApp kalian
global.author = 'Ryxz'
global.botname = 'Neko-Bot'
global.packname = 'Bot-Md'
global.timezone = ''
global.locale = ''
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


global.my = {
	yt: "https://",
	web: 'https://ryxzmc.vercel.app
	tele: 't.me/RyxzMC',
	email: "ryxzmd24@gmail.com"
	
// TAMBAHIN SENDIRI DI SINI	
global.webname = ''
global.ig = ''
global.email = ''
global.sc = ''
global.yt = ''

global.listv = ['•','●','■','✿','▲','➩','➢','➣','➤','✦','✧','△','❀','○','□','♤','♡','◇','♧','々','〆']
global.tempatDB = 'database.json' // Taruh url mongodb di sini jika menggunakan mongodb. Format : 'mongodb+srv://...'
global.tempatStore = 'baileys_store.json' // Taruh url mongodb di sini jika menggunakan mongodb. Format : 'mongodb+srv://...'
global.pairing_code = true
global.number_bot = '' // Kalo pake panel bisa masukin nomer di sini, jika belum ambil session. Format : '628xx'

global.fake = {
	anonim: 'https://telegra.ph/file/95670d63378f7f4210f03.png',
	thumbnailUrl: 'https://telegra.ph/file/fe4843a1261fc414542c4.jpg',
	thumbnail: fs.readFileSync('./src/media/naze.png'),
	docs: fs.readFileSync('./src/media/fake.pdf'),
	listfakedocs: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/pdf'],
}

global.my = {
	yt: "https://",
	gh: "https://",
	gc: "https://",
	ch: ""
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
	key: "Apikey limit! Silahkan Upgrade: https://naze.biz.id",
	owner: "Khusus Owner!",
	admin: "Khusus Admin!",
	botAdmin: "Bot harus Admin!",
	onWa: "Nomor tersebut tidak terdaftar di WhatsApp!",
	group: "Khusus Grup!",
	private: "Khusus Private Chat!",
	quoted: "Reply pesannya!",
	limit: "Limit habis!",
	prem: "Khusus Premium!",
	text: "Masukkan teksnya!",
	media: "Kirim medianya!",
	wait: "Proses...",
	fail: "Gagal!",
	error: "Error!",
	done: "Selesai!"
}

global.APIs = {
	ryxz: 'https://api.ryxz.dev.id',
	NekoBot: 'https://api.nekobot.xyz/6969',
}
global.APIKeys = {
	'https://api.ryxz.dev.id': 'nr-346227rnf61',
	'https://api.nekobot.xyz/6969': 'ROOT_NEKOBOT_ACCES_1337',
}

// Lainnya
global.jadwalSholat = {
	Subuh: '04:30',
	Dzuhur: '12:06',
	Ashar: '15:21',
	Maghrib: '18:08',
	Isya: '19:00'
}

global.badWords = ["dongo","konsol"] // input kata-kata toxic yg lain. ex: ['dongo','dongonya']
global.chatLength = 1000

fs.watchFile(__filename, async () => {
	console.log(chalk.yellowBright(`[UPDATE] ${__filename}`))
});
