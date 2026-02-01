import { EmbedBuilder } from 'discord.js'

const DEFAULT_CONFIG = {
    TITLE: 'Bot Helper - VibeCity RP',
    FOOTER_TEXT: 'Alice AI - Vibe cao, City chất',
    TYPES: {
        SUCCESS: { COLOR: '#00FFD1', ICON: '✅' },
        WARNING: { COLOR: '#FBFF00', ICON: '⚠️' },
        ERROR: { COLOR: '#FF0000', ICON: '❌' }
    }
}

const createBaseEmbed = (description, type, botConfig = null) => {
    // Ưu tiên config từ DB của bot, nếu không có dùng mặc định
    const config = botConfig?.config || DEFAULT_CONFIG;
    const typeConfig = config.TYPES?.[type] || DEFAULT_CONFIG.TYPES[type];

    let color = botConfig?.config?.colors?.[type.toLowerCase()] || typeConfig.COLOR;

    // Đảm bảo mã màu hex hợp lệ
    if (color && typeof color === 'string' && color.startsWith('#') && color.length > 7) {
        color = color.substring(0, 7);
    }

    return new EmbedBuilder()
        .setTitle(botConfig?.config?.embedTitle || botConfig?.name || DEFAULT_CONFIG.TITLE)
        .setColor(color || DEFAULT_CONFIG.TYPES[type].COLOR)
        .setDescription(description)
        .setFooter({ text: botConfig?.config?.footerText || DEFAULT_CONFIG.FOOTER_TEXT })
        .setTimestamp();
}

export const createSuccessEmbed = (text, botConfig) => createBaseEmbed(text, 'SUCCESS', botConfig)
export const createWarningEmbed = (text, botConfig) => {
    const icon = botConfig?.config?.TYPES?.WARNING?.ICON || DEFAULT_CONFIG.TYPES.WARNING.ICON;
    return createBaseEmbed(`${icon} ${text}`, 'WARNING', botConfig);
}
export const createErrorEmbed = (text, botConfig) => {
    const icon = botConfig?.config?.TYPES?.ERROR?.ICON || DEFAULT_CONFIG.TYPES.ERROR.ICON;
    return createBaseEmbed(`${icon} ${text}`, 'ERROR', botConfig);
}
