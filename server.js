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

import multer from 'multer'
import fs from 'fs'

const app = express()
const PORT = process.env.DASHBOARD_PORT || 3000

// Cấu hình multer để lưu tạm file
const upload = multer({ dest: 'uploads/' })

app.use(cors())
app.use(express.json())
app.use(express.static('dashboard'))

// Khởi tạo Qdrant khi start server
initCollection()

/**
 * Thống kê kiến thức
 */
app.get('/api/knowledge', async (req, res) => {
    try {
        const data = await getAllKnowledge()
        res.json(data)
    } catch (error) {
        res.status(500).json({ error: error.message })
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
        res.status(500).json({ error: error.message })
    }
})

/**
 * Upload file tài nguyên
 */
app.post('/api/knowledge/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

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
        res.status(500).json({ error: error.message })
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
        res.status(500).json({ error: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`🚀 Alice Dashboard API running at http://localhost:${PORT}`)
})
