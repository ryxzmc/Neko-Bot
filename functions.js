import chalk from 'chalk';
import cfonts from 'cfonts';
import fs from 'fs';
import path from 'path';
import { creds, DEFAULT_HEADERS } from './constants.js';
import { groupID, temp } from '../config.js';
import { createRequire } from 'module'; 
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import yargs from 'yargs';
import chokidar from 'chokidar'
import crypto from 'crypto'
import { exec } from 'child_process'
import fetch from 'node-fetch'
import axios from 'axios'
import { promisify } from 'util'
import PhoneNumber from 'awesome-phonenumber';

export async function runAnimation(name, nameProyect, author, description) {
    const { say, render } = cfonts
    console.log(chalk.cyan.bold('\n🌎 Menyiapkan lingkungan untuk Bot... 🌏\n'));

    const {ANIFramesAnimation} = await import('./constants.js')
    const consoleWidth = process.stdout.columns || 80
    let lastFrame = ANIFramesAnimation[ANIFramesAnimation.length - 1].split('\n').map(line => line.trimEnd())
    const maxWidth = Math.max(...lastFrame.map(line => line.length))
    const padding = Math.floor((consoleWidth - maxWidth) / 2)
    const centeredFrames = ANIFramesAnimation.map(frame => {
        return frame.split('\n').map(line => ' '.repeat(padding > 0 ? padding : 0) + line.trimEnd()).join('\n')
    })
    let i = 0;
    await new Promise(resolve => {
        const interval = setInterval(() => {
            console.clear();
            console.log(chalk.magentaBright('\nMemuat lingkungan...'));
            console.log(chalk.blueBright(centeredFrames[i]));
            i = (i + 1) % ANIFramesAnimation.length;
        }, 250);
        setTimeout(() => {
            clearInterval(interval);
            console.clear();
            lastFrame = lastFrame.map(line => ' '.repeat(padding > 0 ? padding : 0) + line)
            const rendered = render(nameProyect, {font: 'tiny', align: 'center', colors: ['cyan', 'blue'], space: false, lineHeight: 1}).string.split('\n')

            const mid = Math.floor((lastFrame.length - rendered.length) / 2)
            lastFrame.splice(mid, 0, ...rendered)
            setTimeout(() => {
                console.log(chalk.blueBright(lastFrame.join('\n')))
                console.log('✅ㅤMemulai...')
                say(`${nameProyect}\nWhatsApp - Bots`, {
                    font: 'chrome',
                    align: 'center',
                    gradient: ['red', 'magenta']
                })
                say(`${description} Oleh @${author.name || author}`, {
                    font: 'console',
                    align: 'center',
                    gradient: ['red', 'magenta']
                })
                setTimeout(() => resolve(), 500)
            }, 80)
        }, 2000);
    })
}

export const execAsync = promisify(exec)

export let opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());

export let prefix = new RegExp('^[' + (opts['prefix'] || '*/i!#$%+£¢€¥^°=¶∆×÷π√✓©®?&.\\-.@').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']');

export function __filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') { 
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString() 
}; 
export function dirname(pathURL) { return path.dirname(__filename(pathURL, true)) }; 
export const __require = function require(dir = import.meta.url) { return createRequire(dir) }
export const libPath = dirname(import.meta.url)
export const require = createRequire(libPath)

export async function question(text, validate) {
    return new Promise((resolve) => {
        const ask = () => {
            process.send({ type: 'ask', text });
            process.once('message', (response) => {
                if (response.type === 'response') {
                    const answer = response.answer.trim()
                    if (validate(answer)) {
                        resolve(answer); 
                    } else {
                        ask();
                    }
                }
            });
        };
        ask(); 
    });
}

/**
 * Kode pairing untuk klien web
 */
export async function terminalQuestion(conn) {
    let { configDinamics } = await import('./database.js')

    const start = (await configDinamics()).start
    const connCreds = conn.authState.creds

    if (!connCreds.registered) {
        if (start.usePairingCode) {
            if (start.useMobile) {
                throw new Error('Tidak dapat menggunakan kode pairing dengan API seluler');
            }

            const phoneNumber = await question('Masukkan nomor telepon Anda\n*Harus tanpa spasi dan menggunakan kode negara lengkap:\n', (answer) => /^\d+$/.test(answer));
            if (/\d+/.test(phoneNumber)) {
                const code = await conn.requestPairingCode(formatNumberWA(phoneNumber));
                console.log(`Kode Pairing: ${code}`);
            } else {
                throw new Error('Nomor telepon tidak valid\nHarus berupa angka tanpa spasi');
            }
        }

        if (start.useMobile) {
            const { registration } = connCreds || { registration: {} };

            if (!registration.phoneNumber) {
                registration.phoneNumber = await question('Masukkan nomor telepon Anda:\n');
            }

            const phoneNumber = new PhoneNumber(registration.phoneNumber);
            if (!phoneNumber?.isValid()) {
                throw new Error('Nomor telepon tidak valid: ' + registration.phoneNumber);
            }

            registration.phoneNumber = phoneNumber.format('E.164');
            registration.phoneNumberCountryCode = phoneNumber.countryCallingCode;
            registration.phoneNumberNationalNumber = phoneNumber.nationalNumber;
            const mcc = PHONENUMBER_MCC[phoneNumber.countryCallingCode];
            if (!mcc) {
                throw new Error('Tidak dapat menemukan MCC untuk nomor telepon: ' + registration.phoneNumber + '\nHarap tentukan MCC secara manual.');
            }

            registration.phoneNumberMobileCountryCode = mcc;
            askForOTP(conn, registration);
        }
    }
}

async function enterCode(conn, registration) {
    try {
        const code = await question('Masukkan kode verifikasi:\n');
        const response = await conn.register(code.replace(/["']/g, '').trim().toLowerCase());
        console.log('Berhasil mendaftarkan nomor telepon Anda.');
        console.log(response);
    } catch (error) {
        console.error('Gagal mendaftarkan nomor telepon. Silakan coba lagi.\n', error);
        await askForOTP(conn, registration);
    }
}

async function enterCaptcha(conn, registration) {
    const response = await conn.requestRegistrationCode({ ...registration, method: 'captcha' });

    const path = path.join(temp, '/captcha.png');
    fs.writeFileSync(path, Buffer.from(response.image_blob, 'base64'));

    open(path);
    const code = await question('Masukkan kode Captcha:\n');
    fs.unlinkSync(path);
    registration.captcha = code.replace(/["']/g, '').trim().toLowerCase();
}

async function askForOTP(conn, registration) {
    if (!registration.method) {
        let code = await question('Bagaimana Anda ingin menerima kode pendaftaran? "SMS" atau "suara"\n');
        code = code.replace(/["']/g, '').trim().toLowerCase();
        if (code !== 'sms' && code !== 'voice') {
            return await askForOTP();
        }
        registration.method = code;
    }

    try {
        await conn.requestRegistrationCode(registration);
        await enterCode(conn, registration);
    } catch (error) {
        console.error('Tidak dapat meminta kode pendaftaran. Silakan coba lagi.\n', error);

        if (error?.reason === 'code_checkpoint') {
            await enterCaptcha(conn, registration);
        }

        await askForOTP(conn, registration);
    }
}

export function splitInternationalNumbers(str) {
    const results = [];
    let i = 0;

    while (i < str.length) {
        let found = null;

        for (let len = 5; len <= 15 && i + len <= str.length; len++) {
            const candidate = str.slice(i, i + len);
            const pn = new PhoneNumber('+' + candidate);

            if (pn.isValid()) {
                found = pn.getNumber('e164');
                i += len;
                break;
            }
        }

        if (found) {
            results.push(found);
        } else {
            i++;
        }
    }

    return results;
}

export const printQRIfNecessaryListener = (ev, logger) => {
    ev.on('connection.update', async ({ qr }) => {
        if (qr) {
            const QR = await import('qrcode-terminal')
                .then(m => m.default || m)
                .catch(() => {
                    logger.error('qrcode-terminal tidak ditambahkan sebagai dependensi');
                });
            QR === null || QR === void 0 ? void 0 : QR.generate(qr, { small: true });
        }
    });
};

export async function sessionCheck(pathSession, pathRespald, onBot) {
    if (!fs.existsSync(pathSession)) {
        fs.mkdirSync(pathSession);
        console.log(`Direktori ${pathSession} berhasil dibuat`);
    }
    if (!fs.existsSync(pathRespald)) {
        fs.mkdirSync(pathRespald);
        console.log(`Direktori ${pathRespald} berhasil dibuat`);
    }
    const readBotPath = fs.readdirSync(pathSession)
    const readBotDirBackup = fs.readdirSync(pathRespald)
    const fileCredsResp = path.join(pathRespald, creds)
    if (readBotPath.includes(creds)) {
        const filePathCreds = path.join(pathSession, creds)
        try {
            const readCreds = JSON.parse(fs.readFileSync(filePathCreds));
            const userJid = readCreds && readCreds.me && readCreds.me.jid.split('@')[0]
            const {statusCreds, msg: msgC} = await credsStatus(pathSession, userJid)
            const {validate, msg: msjJ} = validateJSON(filePathCreds)
            console.info(`${msgC}\n${msjJ}`)
            if (statusCreds && validate) {
                backupCreds(pathSession, pathRespald)
                onBot(pathSession)
            } else {
                if (readBotDirBackup.includes(creds)) {
                    const {statusCredsBackup} = await backupCredsStatus(pathRespald)
                    const {validate} = validateJSON(fileCredsResp)
                    if (statusCredsBackup && validate) {
                        respaldCreds(pathSession, pathRespald)
                    } else {
                        cleanupOnConnectionError(pathSession, pathRespald)
                    }
                }
            }
        } catch (error) {
            console.log('Error Inisialisasi: ', error)
            const {statusCredsBackup} = await backupCredsStatus(pathRespald)
            const {validate} = validateJSON(fileCredsResp)
            if (statusCredsBackup && validate) {
                respaldCreds(pathSession, pathRespald)
            } else {
                cleanupOnConnectionError(pathSession, pathRespald)
            }
        }
    } else {
        onBot(pathSession)
    }
}

export function validateJSON(filePath) {
    try {
        let statsCreds = fs.statSync(filePath);
        var msg
        if (statsCreds && statsCreds.size !== 0) {
            const data = fs.readFileSync(filePath, 'utf8');
            let readCreds = JSON.parse(data);
            if (readCreds && readCreds.me && (readCreds.me.id || readCreds.me.jid) && readCreds.hasOwnProperty('platform')) {
                msg = `File JSON di folder ${filePath} valid.`;
                return {validate: true, msg}
            }
        } else {
            msg = `File JSON di folder ${filePath} tidak valid atau kosong.`;
            return {validate: false, msg}
        }
    } catch (error) {
        msg = 'Kesalahan sintaks pada JSON: ' + error.message;
        return {validate: false, msg}
    }
}

export async function backupCreds(pathSession, pathBackUp) {
    if (!fs.existsSync(pathBackUp)) {
        fs.mkdirSync(pathBackUp)
        console.log(`Direktori cadangan ${pathBackUp} berhasil dibuat`);
    }
    const credsFilePath = path.join(pathSession, creds)
    const backupFilePath = path.join(pathBackUp, creds)
    if (fs.existsSync(backupFilePath)) {
        const {validate, msg} = validateJSON(backupFilePath)
        if (validate) {
            const statsCreds = fs.statSync(credsFilePath);
            const statBackUpCreds = fs.statSync(backupFilePath);
            if (statsCreds.mtimeMs > statBackUpCreds.mtimeMs) {
                fs.copyFileSync(credsFilePath, backupFilePath);
                return `${msg} File cadangan telah diperbarui.`
            } else {
                return `${msg} File cadangan tidak diperbarui karena file asli sama atau lebih lama dari cadangan.`
            }
        } else {
            return `${msg} Perlu diganti.`
        }
    } else {
        fs.copyFileSync(credsFilePath, backupFilePath);
        console.log(`File cadangan dibuat: ${backupFilePath}`);
    }
}

export async function respaldCreds(pathSession, pathBackUp) {
    if (!fs.existsSync(pathSession)) {
        fs.mkdirSync(pathSession);
        console.log(`Direktori sesi ${pathSession} berhasil dibuat`);
    }
    const fileCredsResp = path.join(pathBackUp, creds)
    const fileCreds = path.join(pathSession, creds)
    if (fs.existsSync(fileCredsResp)) {
        const {validate, msg} = validateJSON(fileCredsResp)
        if (validate) {
            fs.copyFileSync(fileCredsResp, fileCreds, 2);
            return `${msg}\nBerhasil memulihkan file dari cadangan: ${fileCredsResp} -> ${fileCreds}`;
        }
    } 
}

export async function credsStatus(pathSession, userJid) {
    try {
        const filesSession = fs.readdirSync(pathSession);
        var msg
        if (filesSession.includes(creds)) {
            const credsFilePath = path.join(pathSession, creds)
            const statsCreds = fs.statSync(credsFilePath);
            if (statsCreds && statsCreds.size !== 0) {
                try {
                    const readCreds = JSON.parse(fs.readFileSync(credsFilePath));
                    if (readCreds && readCreds.me && (readCreds.me.id || readCreds.me.jid) && readCreds.hasOwnProperty('platform')) {
                        msg = `File creds benar untuk ${userJid}.`
                        return {statusCreds: true, msg};
                    } else {
                        msg = `File sesi ${userJid} tidak memiliki properti yang benar. Harap lakukan pencadangan segera.`
                        return {statusCreds: false, msg};
                    }
                } catch (error) {
                    console.error(`File sesi ${userJid} tidak dapat dibaca saat ini. Detail:\n\n${error.stack}`)
                    return {statusCreds: false, msg};
                }
            } else {
                msg = `File sesi ${userJid} salah atau berukuran 0 byte.`
                return {statusCreds: false, msg};
            }
        } else {
            msg = `File sesi ${userJid} tidak ditemukan di lokasi yang diharapkan.`
            return {statusCreds: false, msg};
        }
    } catch (error) {
        msg = error.stack
        return {statusCreds: false, msg};
    }
}

export async function backupCredsStatus(pathBackUp) {
    var msg
    if (fs.existsSync(pathBackUp)) {
        const readDirRespald = fs.readdirSync(pathBackUp);
        if (readDirRespald.includes(creds)) {
            const backupFilePath = path.join(pathBackUp, creds)
            const statBackUpCreds = fs.statSync(backupFilePath);
            if (statBackUpCreds.size !== 0) {
                try {
                    const readCredsResp = JSON.parse(fs.readFileSync(backupFilePath));
                    if (readCredsResp && readCredsResp.me && (readCredsResp.me.id || readCredsResp.me.jid) && readCredsResp.hasOwnProperty('platform')) {
                        msg = 'File cadangan benar.'
                        return {statusCredsBackup: true, msg}
                    } else {
                        msg = 'File cadangan tidak memiliki properti yang benar.'
                        return {statusCredsBackup: false, msg};
                    }
                } catch (error) {
                    msg = `File cadangan tidak dapat dibaca. Detail:\n\n${error.stack}`
                    return {statusCredsBackup: false, msg};
                }
            } else {
                msg = 'File cadangan salah atau berukuran 0 byte.'
                return {statusCredsBackup: false, msg};
            }
        } else {
            msg = 'File cadangan tidak ditemukan.'
            return {statusCredsBackup: false, msg};
        }
    } else {
        msg = 'Folder cadangan kredensial tidak ditemukan.'
        return {statusCredsBackup: false, msg};
    }
}

export async function cleanupOnConnectionError(pathSession, pathBackUp) {
    let { configDinamics } = await import('./database.js')

    const start = (await configDinamics()).start
    const {jadibts} = await import('../config.js')
    fs.readdirSync(pathSession).forEach(file => {
        const sessionFilePath = path.join(pathSession, file);
        try {
            fs.rmSync(pathSession, { recursive: true, force: true });
            console.log(`File dihapus: ${sessionFilePath}`);
        } catch (error) {
            console.log(`Tidak dapat menghapus file: ${sessionFilePath}`);
        }
    });
    if (fs.existsSync(pathBackUp)) {
        const backupFilePath = path.join(pathBackUp, creds);
        try {
            fs.rmSync(pathBackUp, { recursive: true, force: true });
            console.log(`File cadangan dihapus: ${backupFilePath}`);
        } catch (error) {
            console.log(`Tidak dapat menghapus file cadangan: ${backupFilePath}`);
        }
    }
    if (fs.existsSync(jadibts)) {
        if (!start.aniJdbts || fs.readdirSync(jadibts).length === 0) {
            process.send(`reset`)
        }
    } else process.send(`reset`)
}

export async function clearTmp(time) {
    const tmp = [temp]
    let files = []
    let msg
    if (time) {
        tmp.forEach(dirname => fs.readdirSync(dirname).forEach(file => files.push(path.join(dirname, file))))
        files.forEach((file, i) => {
            try {
                const stats = fs.statSync(file)
                if (stats.isFile() && (Date.now() - stats.mtimeMs >= time)) {
                    fs.unlinkSync(file)
                    files = files.slice(i + 1); 
                } else {
                    msg = setTimeout(() => {
                        clearTmp()
                    }, time)
                    if (files.length === 0) {
                        clearTimeout(msg)
                    }
                }
            } catch (error) {
                clearTmp()
            }
        })
        console.log(chalk.cyanBright(`\n▣────────[ BERSIHKAN TMP ]───────────···\n│\n▣─❧ ${files.length} FILE DIHAPUS (LEBIH DARI ${time} MS) ✅\n│\n▣────────────────────────────────────···\n`))
        if (files.length === 0) {
            clearTimeout(msg)
        }
    } else {
        tmp.forEach(dirname => {
            fs.readdirSync(dirname).forEach(file => {
                files.push(path.join(dirname, file))
                const filePath = path.join(dirname, file);
                try {
                    if (fs.statSync(filePath).isFile()) {
                        fs.unlinkSync(filePath);
                    }
                } catch (e) {
                    console.error(`Gagal menghapus ${filePath}:`, e);
                }
            });
        });
        console.info(chalk.cyanBright(`\n▣────────[ BERSIHKAN TMP ]───────────···\n│\n▣─❧ ${files.length} FILE BERHASIL DIHAPUS ✅\n│\n▣────────────────────────────────────···\n`))
    }
}

export async function limpCarpetas(dirPath) {
    try {
        const files = fs.readdirSync(dirPath, { recursive: true });
        if (files.length !== 0) {
            files.forEach((file) => {
                const filePath = path.j