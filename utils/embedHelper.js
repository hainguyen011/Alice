import { EmbedBuilder } from 'discord.js'
import { ALICE_CONFIG } from '../config/aliceConfig.js'

const createBaseEmbed = (description, type) => {
    const config = ALICE_CONFIG.EMBED
    const typeConfig = config.TYPES[type]

    let color = typeConfig.COLOR;
    // Đảm bảo mã màu hex hợp lệ (6 ký tự)
    if (color && color.startsWith('#') && color.length > 7) {
        color = color.substring(0, 7);
    }

    const embed = new EmbedBuilder()
        .setTitle(config.TITLE)
        .setColor(color || '#00FFD1')
        .setDescription(description)
        .setFooter({ text: config.FOOTER_TEXT })
        .setTimestamp()

    return embed;
}

export const createSuccessEmbed = (text) => createBaseEmbed(text, 'SUCCESS')
export const createWarningEmbed = (text) => createBaseEmbed(`${ALICE_CONFIG.EMBED.TYPES.WARNING.ICON} ${text}`, 'WARNING')
export const createErrorEmbed = (text) => createBaseEmbed(`${ALICE_CONFIG.EMBED.TYPES.ERROR.ICON} ${text}`, 'ERROR')
