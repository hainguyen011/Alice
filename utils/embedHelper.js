import { EmbedBuilder } from 'discord.js'
import { ALICE_CONFIG } from '../config/aliceConfig.js'

const createBaseEmbed = (description, type) => {
    const config = ALICE_CONFIG.EMBED
    const typeConfig = config.TYPES[type]

    return new EmbedBuilder()
        .setTitle(config.TITLE)
        .setColor(typeConfig.COLOR)
        .setDescription(description)
        .setFooter({ text: config.FOOTER_TEXT })
        .setTimestamp()
}

export const createSuccessEmbed = (text) => createBaseEmbed(text, 'SUCCESS')
export const createWarningEmbed = (text) => createBaseEmbed(`${ALICE_CONFIG.EMBED.TYPES.WARNING.ICON} ${text}`, 'WARNING')
export const createErrorEmbed = (text) => createBaseEmbed(`${ALICE_CONFIG.EMBED.TYPES.ERROR.ICON} ${text}`, 'ERROR')
