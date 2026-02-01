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
import { getAIResponse, checkToxicity } from './services/aiService.js'
import { handleViolation } from './services/moderationService.js'
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
  console.log(`Logged in as ${client.user.tag}`)
  console.log(`Loaded commands: ${client.commands.map(c => c.data.name).join(', ')}`)
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
    // --- 1. Kiểm tra ngôn ngữ không phù hợp ---
    const toxicityResult = await checkToxicity(content)
    if (toxicityResult.isToxic) {
      const violated = await handleViolation(message, toxicityResult)
      if (violated) return // Dừng xử lý nếu đã bị mute
    }

    // --- Chuẩn bị danh sách Channels (Input) ---
    // Lấy danh sách tất cả các kênh text để AI biết và gợi ý
    let availableChannels = ''
    if (message.guild) {
      const channels = message.guild.channels.cache
        .filter(c => c.type === 0) // ChannelType.GuildText
        .map(c => `- ${c.name}: <#${c.id}>`)
        .join('\n')

      if (channels) {
        availableChannels = channels
      }
    }

    // --- Chuẩn bị danh sách Role (Input) ---
    let availableRoles = ''
    if (message.guild) {
      const managementKeywords = ['admin', 'quản trị', 'staff', 'mod', 'helper', 'biên phòng', 'công an'];
      const roles = message.guild.roles.cache
        .filter(r => r.name !== '@everyone' &&
          managementKeywords.some(kw => r.name.toLowerCase().includes(kw)))
        .first(15)
        .map(r => `- ${r.name}: <@&${r.id}>`)
        .join('\n')

      if (roles) {
        availableRoles = `Danh sách Role Quản trị/Hỗ trợ:\n${roles}`
      }
    }

    // Truyền context, roles và channels cho AI
    const aiResponse = await getAIResponse(content, {}, '', availableRoles, availableChannels)
    const aiText = typeof aiResponse === 'string' ? aiResponse : aiResponse.text;
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
