import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGenAI } from './aiService.js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to handle image generation via Gemini
 */
class ImageGenService {
    /**
     * Generate an image using a model like imagen-3 (if available) or via REST API
     * @param {string} prompt The text prompt for generation
     * @param {Object} botConfig Bot configuration containing API key
     * @param {string} style Desired style (e.g., "GTA V Art Style", "Comic Book")
     * @returns {Promise<string>} URL or path to the generated image
     */
    async generateImage(prompt, botConfig, style = 'Comics') {
        try {
            const apiKey = botConfig.api_key || process.env.GEMINI_API_KEY;

            // Refine prompt based on style
            const refinedPrompt = this._refinePrompt(prompt, style);

            console.log(`🎨 Generating image with prompt: ${refinedPrompt}`);

            // Note: As of now, image generation with Gemini is often done via Vertex AI or specific Imagen endpoints.
            // For a direct API key usage, we might need to use a specific model name if supported by the SDK, 
            // or perform a direct REST call if the SDK doesn't support imagen yet.

            // For now, we'll implement a placeholder or a presumed SDK structure. 
            // If the SDK doesn't support it directly, we would use fetch to:
            // https://generativelanguage.googleapis.com/v1beta/models/imagen-3:generateImages?key=${apiKey}

            // The correct endpoint for Imagen 3 in Google AI Studio is often:
            // https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages?key=${apiKey}
            // However, some regions/keys might use different model versions.

            const modelName = 'imagen-4.0-generate-001';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:predict?key=${apiKey}`;

            console.log(`📡 Calling Gemini Imagen API: ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instances: [
                        { prompt: refinedPrompt }
                    ],
                    parameters: {
                        sampleCount: 1,
                        // aspect_ratio: "1:1",
                    }
                })
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse API response as JSON:', responseText);
                throw new Error(`API returned invalid JSON (Status ${response.status})`);
            }

            if (!response.ok) {
                console.error('Image Generation API Error Detailed:', JSON.stringify(data, null, 2));
                throw new Error(data.error?.message || `Failed to generate image (Status ${response.status})`);
            }

            // In Vertex AI/Generative Language :predict response:
            // data.predictions[0].bytesBase64Encoded
            const imageData = data.predictions?.[0]?.bytesBase64Encoded ||
                data.images?.[0]?.image?.encodedImage ||
                data.images?.[0]?.base64;

            if (!imageData) {
                console.error('Unexpected Image API Response Structure:', JSON.stringify(data, null, 2));
                throw new Error('No image data returned from Gemini Imagen. Check logs for structure.');
            }

            // Save to local uploads folder
            const fileName = `comic_${uuidv4()}.png`;
            const uploadDir = path.join(process.cwd(), 'uploads');
            const uploadPath = path.join(uploadDir, fileName);

            // Ensure uploads directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // If it's a Buffer already or if we need to convert from base64 string
            const buffer = Buffer.from(imageData, 'base64');
            fs.writeFileSync(uploadPath, buffer);

            // Return public URL
            return `/uploads/${fileName}`;

        } catch (error) {
            console.log(`⚠️ Gemini Imagen failed: ${error.message}. Trying fallbacks...`);

            // Try multiple fallbacks in order
            const fallbacks = [
                {
                    name: 'Pollinations.ai',
                    fn: async (prompt) => {
                        const simplePrompt = prompt.substring(0, 500);
                        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(simplePrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
                        console.log(`📡 Trying Pollinations.ai...`);
                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`Status ${res.status}`);
                        return await res.arrayBuffer();
                    }
                },
                {
                    name: 'Picsum (Random Photos)',
                    fn: async () => {
                        // Fallback to random high-quality photos as placeholder
                        const url = `https://picsum.photos/1024/1024?random=${Date.now()}`;
                        console.log(`📡 Trying Picsum Photos...`);
                        const res = await fetch(url);
                        if (!res.ok) throw new Error(`Status ${res.status}`);
                        return await res.arrayBuffer();
                    }
                }
            ];

            for (const fallback of fallbacks) {
                try {
                    const buffer = await fallback.fn(prompt);
                    if (!buffer || buffer.byteLength < 1000) {
                        throw new Error('Invalid/empty image');
                    }

                    const fileName = `comic_fallback_${uuidv4()}.png`;
                    const uploadDir = path.join(process.cwd(), 'uploads');
                    const uploadPath = path.join(uploadDir, fileName);

                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    fs.writeFileSync(uploadPath, Buffer.from(buffer));
                    console.log(`✅ ${fallback.name} succeeded! Image saved to ${uploadPath}`);

                    return `/uploads/${fileName}`;
                } catch (fallbackError) {
                    console.error(`❌ ${fallback.name} failed:`, fallbackError.message);
                    // Continue to next fallback
                }
            }

            // All fallbacks failed
            console.error('CRITICAL: All image generation methods failed');
            console.log('⚠️ Continuing without image - chapter will be created with text only');
            return '';
        }
    }

    /**
     * Refine prompt with style-specific keywords
     */
    _refinePrompt(prompt, style) {
        let styleKeywords = '';

        switch (style.toLowerCase()) {
            case 'gta style':
            case 'gtav':
                styleKeywords = 'Grand Theft Auto V digital art style, high contrast, saturated colors, bold outlines, cinematic lighting, Rockstar Games aesthetic, loading screen art style.';
                break;
            case 'comics':
            case 'comic book':
                styleKeywords = 'American comic book art style, ink lines, vibrant colors, halftone patterns, dramatic shadows, superhero aesthetic.';
                break;
            case 'anime':
            case 'manga':
                styleKeywords = 'Modern anime style, clean line art, soft shading, high detail, expressive characters.';
                break;
            default:
                styleKeywords = `${style} art style.`;
        }

        return `${prompt}. Style: ${styleKeywords} Ensure high quality, 4k resolution, and character consistency.`;
    }
}

export const imageGenService = new ImageGenService();
