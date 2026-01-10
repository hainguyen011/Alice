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
import { ALICE_CONFIG } from './config/aliceConfig.js'
import { getAIResponse } from './services/aiService.js'
import {
  createSuccessEmbed,
  createWarningEmbed,
  createErrorEmbed
} from './utils/embedHelper.js'
import { logConversation } from './services/conversationService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = interaction.client.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true })
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true })
    }
  }
})

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return
  if (!message.mentions.has(client.user)) return

  const content = message.content
    .replace(`<@${client.user.id}>`, '')
    .replace(`<@!${client.user.id}>`, '')
    .trim()

  if (!content) {
    const embed = createWarningEmbed(ALICE_CONFIG.EMBED.MESSAGES.NO_CONTENT)
    await message.reply({ embeds: [embed] })
    return
  }

  try {
    const aiText = await getAIResponse(content)
    const embed = createSuccessEmbed(aiText)
    await message.reply({ embeds: [embed] })

    // Ghi log cuộc hội thoại
    await logConversation(message.author.username, message.author.id, content, aiText)
  } catch (error) {
    console.error('Gemini AI Error:', error)
    const errorEmbed = createErrorEmbed(ALICE_CONFIG.EMBED.MESSAGES.ERROR)
    await message.reply({ embeds: [errorEmbed] })
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)
