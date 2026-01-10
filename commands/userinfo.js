import { SlashCommandBuilder } from 'discord.js'
import { createSuccessEmbed } from '../utils/embedHelper.js'

export default {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Xem thông tin chi tiết của người dùng.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Người dùng bạn muốn xem (để trống nếu xem bản thân)')),
    async execute(interaction) {
        await interaction.deferReply()
        const user = interaction.options.getUser('target') || interaction.user
        const member = await interaction.guild.members.fetch(user.id)

        const roles = member.roles.cache
            .filter(r => r.name !== '@everyone')
            .map(r => r.toString())
            .join(', ') || 'Không có'

        const embed = createSuccessEmbed('')
            .setTitle(`👤 Thông Tin Người Dùng: ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🆔 ID', value: user.id, inline: true },
                { name: '📅 Tham Gia Discord', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '🏠 Tham Gia Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🎭 Roles', value: roles }
            )

        await interaction.editReply({ embeds: [embed] })
    }
}
