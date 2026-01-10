import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { getEmbedding } from './services/aiService.js'
import {
    initCollection,
    upsertKnowledge,
    getAllKnowledge,
    deleteKnowledge
} from './services/qdrantService.js'
import { addMessageToMemory, getContext } from './services/memoryService.js'
import { getConversations, logConversation, syncDiscordHistory } from './services/conversationService.js'
import {
    Client,
    Events,
    GatewayIntentBits,
    Collection
} from 'discord.js'
import { ALICE_CONFIG } from './config/aliceConfig.js'
import { getAIResponse } from './services/aiService.js'
import {
    createSuccessEmbed,
    createWarningEmbed,
    createErrorEmbed
} from './utils/embedHelper.js'

import multer from 'multer'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.DASHBOARD_PORT || 3000

// --- Discord Bot Integration ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

client.commands = new Collection()
const commandsPath = path.join(__dirname, 'commands')
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))
    for (const file of commandFiles) {
        const command = (await import(`./commands/${file}`)).default
        client.commands.set(command.data.name, command)
    }
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

    // --- Xử lý Role Mentions (Input) ---
    // Thay thế <@&roleId> bằng @RoleName để AI hiểu ngữ cảnh
    let processedContent = message.content
    if (message.guild) {
        message.mentions.roles.forEach(role => {
            processedContent = processedContent.replace(`<@&${role.id}>`, `@${role.name}`)
        })
    }

    // 1. Luôn thêm tin nhắn (đã xử lý) vào bộ nhớ ngữ cảnh
    addMessageToMemory(
        message.channelId,
        message.author.username,
        processedContent,
        false // isBot = false
    )

    if (!message.mentions.has(client.user)) return

    // Clean content cho AI (xóa mention bot)
    const contentForAI = processedContent
        .replace(`<@${client.user.id}>`, '')
        .replace(`<@!${client.user.id}>`, '')
        .trim()

    if (!contentForAI) {
        const embed = createWarningEmbed(ALICE_CONFIG.EMBED.MESSAGES.NO_CONTENT)
        await message.reply({ embeds: [embed] })
        return
    }

    try {
        // 2. Lấy ngữ cảnh hội thoại
        const context = getContext(message.channelId)

        // --- Chuẩn bị danh sách Role (Output) ---
        // Tạo danh sách role để AI có thể tag khi cần hỗ trợ
        // Định dạng: - Tên Role: <@&ID>
        let availableRoles = ''
        if (message.guild) {
            // Lấy 20 roles đầu tiên để tránh quá dài (bỏ @everyone)
            const roles = message.guild.roles.cache
                .filter(r => r.name !== '@everyone')
                .first(20)
                .map(r => `- ${r.name}: <@&${r.id}>`)
                .join('\n')

            if (roles) {
                availableRoles = `Danh sách Role khả dụng (Sử dụng cú pháp <@&ID> để tag):\n${roles}`
            }
        }

        // --- Chuẩn bị danh sách Channels (Output) ---
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

        // 3. Gửi kèm ngữ cảnh vả danh sách Role cho AI
        const aiText = await getAIResponse(contentForAI, context, availableRoles, availableChannels)
        const embed = createSuccessEmbed(aiText)
        await message.reply({ embeds: [embed] })

        // 4. Lưu phản hồi của Bot vào bộ nhớ
        addMessageToMemory(
            message.channelId,
            'Alice',
            aiText,
            true // isBot = true
        )

        // Ghi log cuộc hội thoại
        await logConversation(message.author.username, message.author.id, contentForAI, aiText)
    } catch (error) {
        console.error('Gemini AI Error:', error)
        const errorEmbed = createErrorEmbed(ALICE_CONFIG.EMBED.MESSAGES.ERROR)
        await message.reply({ embeds: [errorEmbed] })
    }
})

client.login(process.env.DISCORD_BOT_TOKEN)
// --- End Discord Bot Integration ---

// Cấu hình multer để lưu tạm file
const upload = multer({ dest: 'uploads/' })

// Middleware log yêu cầu (Debug)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use(cors())
app.use(express.json())

// --- API Routes (Chuyển lên trước static để tránh trùng lặp) ---

/**
 * Thống kê kiến thức
 */
app.get('/api/knowledge', async (req, res) => {
    try {
        const data = await getAllKnowledge()
        res.json(data)
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

/**
 * Thêm kiến thức mới (Manual)
 */
app.post('/api/knowledge', async (req, res) => {
    try {
        const { title, content } = req.body
        const id = uuidv4()
        const vector = await getEmbedding(content)

        await upsertKnowledge(id, vector, { title, content, timestamp: new Date().toISOString() })

        res.json({ success: true, id })
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

/**
 * Upload file tài nguyên
 */
app.post('/api/knowledge/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: 'error', error: 'No file uploaded' })

        const filePath = req.file.path
        const content = fs.readFileSync(filePath, 'utf-8')
        const title = req.file.originalname
        const id = uuidv4()

        const vector = await getEmbedding(content)
        await upsertKnowledge(id, vector, { title, content, timestamp: new Date().toISOString() })

        // Xóa file tạm sau khi embedding xong
        fs.unlinkSync(filePath)

        res.json({ success: true, id, title })
    } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({ status: 'error', error: error.message })
    }
})

/**
 * Xóa kiến thức
 */
app.delete('/api/knowledge/:id', async (req, res) => {
    try {
        await deleteKnowledge(req.params.id)
        res.json({ success: true })
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

/**
 * Lấy lịch sử cuộc hội thoại
 */
app.get('/api/conversations', async (req, res) => {
    try {
        const data = await getConversations()
        res.json(data)
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
})

/**
 * Trigger đồng bộ từ Discord
 */
app.post('/api/conversations/sync', async (req, res) => {
    try {
        if (!client.isReady()) {
            return res.status(503).json({ success: false, error: 'Discord client is not ready yet.' })
        }
        const count = await syncDiscordHistory(client)
        res.json({ success: true, count })
    } catch (error) {
        console.error('Sync error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

// --- Static Files & Fallback ---
app.use(express.static('dashboard'))

// Khởi tạo Qdrant khi start server
initCollection()

app.listen(PORT, () => {
    console.log(`🚀 Alice Dashboard API running at http://localhost:${PORT}`)
})
