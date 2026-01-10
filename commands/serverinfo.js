import { SlashCommandBuilder, ChannelType } from 'discord.js'
import { createSuccessEmbed } from '../utils/embedHelper.js'

export default {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Xem thông tin chi tiết về server.'),
    async execute(interaction) {
        await interaction.deferReply()
        const { guild } = interaction

        // Fetch để đảm bảo số liệu chính xác
        // Lưu ý: với server lớn việc fetchChannels/Members có thể tốn resource, nhưng với bot nhỏ thì ok.
        // Với Discord.js v14, một số property có sẵn trong guild cache.

        const owner = await guild.fetchOwner()
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size

        // Member count thường có sẵn
        const totalMembers = guild.memberCount
        const botCount = guild.members.cache.filter(m => m.user.bot).size // Cache might not have all members unless intent is enabled
        // Nếu không có intent Members, số này có thể sai. Nhưng bot Alice hiện có GatewayIntentBits.Guilds (chưa rõ GuildMembers).
        // Tạm thời dùng guild.memberCount là an toàn nhất.

        const embed = createSuccessEmbed('')
            .setTitle(`🏰 Thông Tin Server: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: '👑 Chủ Server', value: owner.user.tag, inline: true },
                { name: '🆔 Server ID', value: guild.id, inline: true },
                { name: '📅 Ngày Tạo', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '👥 Thành Viên', value: `${totalMembers}`, inline: true },
                { name: '🚀 Boost Level', value: `${guild.premiumTier}`, inline: true },
                { name: '💬 Kênh', value: `Text: ${textChannels} | Voice: ${voiceChannels} | Category: ${categories}`, inline: false }
            )

        if (guild.description) {
            embed.setDescription(guild.description)
        }

        await interaction.editReply({ embeds: [embed] })
    }
}
