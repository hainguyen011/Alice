import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Runner đơn giản để khởi động cả Bot và Dashboard mà không cần dùng cmd.exe
 * Giúp tránh lỗi ENOENT trên một số môi trường Windows
 */
const runScript = (scriptPath, label) => {
    const process = spawn('node', [path.join(__dirname, scriptPath)], {
        stdio: 'inherit',
        shell: false // Quan trọng: Không dùng shell để tránh lỗi ENOENT cmd.exe
    })

    process.on('close', (code) => {
        console.log(`[${label}] exited with code ${code}`)
    })

    return process
}

console.log('🚀 Khởi động Alice System (Bot + Dashboard)...')

const bot = runScript('index.js', 'BOT')
const dashboard = runScript('server.js', 'DASHBOARD')

process.on('SIGINT', () => {
    bot.kill()
    dashboard.kill()
    process.exit()
})
