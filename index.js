import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits
} from 'discord.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
})

client.commands = new Collection()

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))

for (const file of commandFiles) {
  const command = (await import(`./commands/${file}`)).default
  client.commands.set(command.data.name, command)
}

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`)
})

client.on(Events.MessageCreate, async (message) => {
  // bỏ qua bot khác
  if (message.author.bot) return

  // CHỈ phản hồi khi bot bị gắn thẻ
  if (!message.mentions.has(client.user)) return

  // phản hồi đúng channel nơi bị mention
  const content = message.content
    .replace(`<@${client.user.id}>`, '')
    .replace(`<@!${client.user.id}>`, '')
    .trim()

  // nếu không có nội dung sau khi mention
  if (!content) {
    await message.reply('👋 Bạn gọi mình có việc gì không?')
    return
  }

  // logic xử lý
  await message.reply(`🤖 Bạn vừa gọi mình và nói: **${content}**`)
})

client.login(process.env.DISCORD_BOT_TOKEN)
