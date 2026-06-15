import { smsg } from './lib/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';

const isNumber = (x) => typeof x === 'number' && !isNaN(x);

/**
 * Handle messages upsert
 * @param {import('baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate
 */
export async function handler(chatUpdate) {
	if (!chatUpdate) return;
	this.pushMessage(chatUpdate.messages).catch(console.error);
	let m = chatUpdate.messages[chatUpdate.messages.length - 1];
	if (!m) return;
	if (global.db.data == null) await global.loadDatabase();
	try {
		m = smsg(this, m) || m;
		if (!m) return;
		m.exp = 0;
		m.limit = false;

		if (m.sender.endsWith('@broadcast') || m.sender.endsWith('@newsletter')) return;
		await (await import(`./lib/database.js?v=${Date.now()}`)).default(m, this);

		if (global.opts?.pconly && m.isGroup) return;
		if (global.opts?.gconly && !m.isGroup) return;
		if (typeof m.text !== 'string') m.text = '';

		const isROwner = [conn.decodeJid(global.conn.user.id), ...global.owner.map(([number]) => number)].map((v) => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
		const isOwner = isROwner || m.fromMe;
		const isMods = isOwner || global.mods.map((v) => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
		const isPrems = isROwner || db.data.users[m.sender].premiumTime > 0;

		if (!global.db.data.settings[this.user.jid].public && !isMods && !isOwner && !m.fromMe) return;
		if (m.isBaileys) return;
		m.exp += Math.ceil(Math.random() * 10);

		let usedPrefix;
		let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender];

		const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata || (await this.groupMetadata(m.chat).catch((_) => null)) : {}) || {};
		const participants = (m.isGroup ? groupMetadata.participants : []) || [];
		const user = (m.isGroup ? participants.find((u) => conn.getJid(u.id) === m.sender) : {}) || {};
		const bot = (m.isGroup ? participants.find((u) => conn.getJid(u.id) == this.user.jid) : {}) || {};
		const isRAdmin = user?.admin == 'superadmin' || false;
		const isAdmin = isRAdmin || user?.admin == 'admin' || false;
		const isBotAdmin = bot?.admin || false;

		const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
		for (let name in global.plugins) {
			let plugin = global.plugins[name];
			if (!plugin) continue;
			if (plugin.disabled) continue;
			const __filename = path.join(___dirname, name);
			if (typeof plugin.all === 'function') {
				try {
					await plugin.all.call(this, m, {
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					});
				} catch (e) {
					console.error(e);
					for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
						let data = (await conn.onWhatsApp(jid))[0] || {};
						if (data.exists) m.reply(`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n\`\`\`${format(e)}\`\`\``.trim(), data.jid);
					}
				}
			}
			if (plugin.tags && plugin.tags.includes('admin')) {
				continue;
			}
			const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
			let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix;
			let match = (
				_prefix instanceof RegExp
					? [[_prefix.exec(m.text), _prefix]]
					: Array.isArray(_prefix)
						? _prefix.map((p) => {
								let re = p instanceof RegExp ? p : new RegExp(str2Regex(p));
								return [re.exec(m.text), re];
							})
						: typeof _prefix === 'string'
							? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
							: [[[], new RegExp()]]
			).find((p) => p[1]);
			if (typeof plugin.before === 'function') {
				if (
					await plugin.before.call(this, m, {
						match,
						conn: this,
						participants,
						groupMetadata,
						user,
						bot,
						isROwner,
						isOwner,
						isRAdmin,
						isAdmin,
						isBotAdmin,
						isPrems,
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					})
				)
					continue;
			}
			if (typeof plugin !== 'function') continue;
			if ((usedPrefix = (match[0] || '')[0])) {
				let noPrefix = m.text.replace(usedPrefix, '');
				let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
				args = args || [];
				let _args = noPrefix.trim().split` `.slice(1);
				let text = _args.join` `;
				command = (command || '').toLowerCase();
				let fail = plugin.fail || global.dfail;
				let isAccept =
					plugin.command instanceof RegExp
						? plugin.command.test(command)
						: Array.isArray(plugin.command)
							? plugin.command.some((cmd) =>
									cmd instanceof RegExp ? cmd.test(command) : cmd === command
								)
							: typeof plugin.command === 'string'
								? plugin.command === command
								: false;

				if (!isAccept) continue;
				m.plugin = name;
				if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
					let chat = global.db.data.chats[m.chat];
					let user = global.db.data.users[m.sender];
					if (name != 'owner-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'tools-delete.js' && chat?.isBanned) return;
					if (name != 'owner-unbanuser.js' && user?.banned) return;
				}
				if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
					fail('owner', m, this);
					continue;
				}
				if (plugin.rowner && !isROwner) {
					fail('rowner', m, this);
					continue;
				}
				if (plugin.owner && !isOwner) {
					fail('owner', m, this);
					continue;
				}
				if (plugin.mods && !isMods) {
					fail('mods', m, this);
					continue;
				}
				if (plugin.premium && !isPrems) {
					fail('premium', m, this);
					continue;
				}
				if (plugin.group && !m.isGroup) {
					fail('group', m, this);
					continue;
				} else if (plugin.botAdmin && !isBotAdmin) {
					fail('botAdmin', m, this);
					continue;
				} else if (plugin.admin && !isAdmin) {
					fail('admin', m, this);
					continue;
				}
				if (plugin.private && m.isGroup) {
					fail('private', m, this);
					continue;
				}
				if (plugin.register == true && _user.registered == false) {
					fail('unreg', m, this);
					continue;
				}
				m.isCommand = true;
				let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17;
				if (xp > 200) m.reply('Ngecit -_-');
				else m.exp += xp;
				if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
					this.reply(m.chat, `[❗] Limit anda habis, silahkan beli melalui *${usedPrefix}buy limit*`, m);
					continue;
				}
				if (plugin.level > _user.level) {
					this.reply(m.chat, `[💬] Diperlukan level ${plugin.level} untuk menggunakan perintah ini\n*Level mu:* ${_user.level} 📊`, m);
					continue;
				}
				let extra = {
					match,
					usedPrefix,
					noPrefix,
					_args,
					args,
					command,
					text,
					conn: this,
					participants,
					groupMetadata,
					user,
					bot,
					isROwner,
					isOwner,
					isRAdmin,
					isAdmin,
					isBotAdmin,
					isPrems,
					chatUpdate,
					__dirname: ___dirname,
					__filename,
				};
				try {
					await plugin.call(this, m, extra);
					if (!isPrems) m.limit = m.limit || plugin.limit || false;
				} catch (e) {
					m.error = e;
					console.error(e);
					if (e) {
						let text = format(e);
						if (e.name)
							for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
								let data = (await conn.onWhatsApp(jid))[0] || {};
								if (data.exists)
									m.reply(
										`*🗂️ Plugin:* ${m.plugin}\n*👤 Sender:* ${m.sender}\n*💬 Chat:* ${m.chat}\n*💻 Command:* ${usedPrefix}${command} ${args.join(' ')}\n📄 *Error Logs:*\n\n\`\`\`${text}\`\`\``.trim(),
										data.jid
									);
							}
						m.reply(text);
					}
				} finally {
					if (typeof plugin.after === 'function') {
						try {
							await plugin.after.call(this, m, extra);
						} catch (e) {
							console.error(e);
						}
					}
					if (m.limit) m.reply(+m.limit + ' Limit terpakai ✔️');
				}
				break;
			}
		}
	} catch (e) {
		console.error(e);
	} finally {
		let user,
			stats = global.db.data.stats;
		if (m) {
			if (m.sender && (user = global.db.data.users[m.sender])) {
				user.exp += m.exp;
				user.limit -= m.limit * 1;

				// ✅ Dailychat tracking
				const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
				if (!user.dailychat) user.dailychat = {};
				if (!user.dailychat[m.chat]) user.dailychat[m.chat] = { count: 0, date: today };
				if (user.dailychat[m.chat].date !== today) {
					user.dailychat[m.chat].count = 0;
					user.dailychat[m.chat].date = today;
				}
				user.dailychat[m.chat].count += 1;
			}

			let stat;
			if (m.plugin) {
				let now = Date.now();
				if (m.plugin in stats) {
					stat = stats[m.plugin];
					if (!isNumber(stat.total)) stat.total = 1;
					if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1;
					if (!isNumber(stat.last)) stat.last = now;
					if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now;
				} else
					stat = stats[m.plugin] = {
						total: 1,
						success: m.error != null ? 0 : 1,
						last: now,
						lastSuccess: m.error != null ? 0 : now,
					};
				stat.total += 1;
				stat.last = now;
				if (m.error == null) {
					stat.success += 1;
					stat.lastSuccess = now;
				}
			}
		}

		try {
			await (await import(`./lib/print.js`)).default(m, this);
		} catch (e) {
			console.log(m, m.quoted, e);
		}
		if (global.db.data.settings[this.user.jid]?.autoread) await conn.readMessages([m.key]);
	}
}

/**
 * Handle groups participants update
 * @param {import('baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate
 */
export async function participantsUpdate({ id, participants, action, simulate = false }) {
	if (this.isInit && !simulate) return;
	if (global.db.data == null) await loadDatabase();

	let chat = global.db.data.chats[id] || {};
	const groupMetadata = (conn.chats[id] || {}).metadata || await this.groupMetadata(id);

	switch (action) {
		case 'add':
		case 'remove':
			if (!chat.welcome) break;

			for (let user of participants) {
				user = this.getJid(user?.phoneNumber || user.id);

				let text = (
					action === 'add'
						? chat.sWelcome || this.welcome || 'Welcome, @user!'
						: chat.sBye || this.bye || 'Bye, @user!'
				)
				.replace('@user', '@' + user.split('@')[0])
				.replace('@subject', this.getName(id))
				.replace('@desc', groupMetadata.desc || '');

				let pp = null;
				try {
					pp = await this.profilePictureUrl(user, 'image');
				} catch {}

				try {
					if (pp) {
						await this.sendMessage(id, { image: { url: pp }, caption: text, mentions: [user] });
					} else {
						await this.sendMessage(id, { text, mentions: [user] });
					}
				} catch {
					await this.sendMessage(id, { text, mentions: [user] });
				}
			}
			break;

		case 'promote':
		case 'demote':
			if (!chat.detect) break;

			for (let users of participants) {
				let user = this.getJid(users?.phoneNumber || users.id);

				let text = (
					action === 'promote'
						? chat.sPromote || '@user sekarang admin'
						: chat.sDemote || '@user bukan admin lagi'
				)
				.replace('@user', '@' + user.split('@')[0]);

				await this.sendMessage(id, { text, mentions: [user] });
			}
			break;
	}
}

/**
 * Handle groups update
 * @param {import('baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate
 */
export async function groupsUpdate(groupsUpdate) {
	for (const groupUpdate of groupsUpdate) {
		const id = groupUpdate.id;
		if (!id) continue;
		let chats = global.db.data.chats[id], text = '';
		if (!chats?.detect) continue;
		if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc);
		if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject);
		if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon);
		if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke);
		if (!text) continue;
		await this.sendMessage(id, { text, mentions: this.parseMention(text) });
	}
}

export async function deleteUpdate(message) {
	try {
		const { fromMe, id, participant } = message;
		if (fromMe) return;
		let msg = this.serializeM(this.loadMessage(id));
		if (!msg) return;
		let chat = global.db.data.chats[msg.chat];
		if (!chat.delete) return;
		await this.reply(
			msg.chat,
			`Terdeteksi @${participant.split`@`[0]} telah menghapus pesan\nUntuk mematikan fitur ini, ketik\n*.enable delete*`.trim(),
			msg,
			{ mentions: [participant] }
		);
		this.copyNForward(msg.chat, msg).catch((e) => console.log(e, msg));
	} catch (e) {
		console.error(e);
	}
}

global.dfail = (type, m, conn) => {
	let msg = {
		rowner: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: `Ara~ command ini hanya untuk developer bot`,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		owner: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: ` fitur ini khusus ownerku `,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		mods: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: ` hanya moderator yang boleh pakai fitur ini`,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		premium: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: `Ups bro fitur ini khusus pengguna premium`,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		group: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: `🌸 Maaf yaa~ fitur ini khusus untuk grup 😊`,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		private: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: `Nee~ command ini hanya bisa dipakai di chat pribadi`,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		admin: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: `⌯˃ ᵕ ˂⌯ಣ Hehe~ cuma admin grup yang punya izin memakai fitur ini 💕`,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		botAdmin: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: `Eits~ fitur ini butuh akses admin 😖\nCoba angkat aku jadi admin dulu ya sayang 💕`,
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Akses dibatasi',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
		unreg: (m, conn) => {
			return conn.sendMessage(m.chat, {
				text: `૮₍ ˃ ⤙ ˂ ₎ა Duhh sayang belum terdaftar nihh~ 💕\nYuk daftar dulu lewat tombol di bawah supaya semua fitur kebuka ✨`,
				buttons: [
					{
						buttonId: `.daftar`,
						buttonText: { displayText: '📝 Daftar Sekarang' },
						type: 1
					}
				],
				footer: 'CHII-MD • Quick Register',
				contextInfo: {
					externalAdReply: {
						title: 'CHII-MD',
						body: 'Silakan daftar terlebih dahulu',
						thumbnailUrl: 'https://raw.githubusercontent.com/himanackerman/Image/main/1767877404043-832.jpeg',
						mediaType: 1,
						renderLargerThumbnail: true,
						sourceUrl: ''
					}
				}
			}, { quoted: m });
		},
	}[type];

	if (!msg) return;
	return msg(m, conn);
};

let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'handler.js'"));
	if (global.reloadHandler) console.log(await global.reloadHandler());
});