import 'dotenv/config'
import { REST, Routes } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const commands = []
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))

for (const file of commandFiles) {
  const command = (await import(`./commands/${file}`)).default
  console.log(`Loading command: ${command.data.name}`)
  commands.push(command.data.toJSON())
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN)

console.log('🚀 Deploying slash commands...')

await rest.put(
  Routes.applicationCommands(process.env.DISCORD_APP_ID),
  { body: commands }
)

console.log('✅ Slash commands deployed')
