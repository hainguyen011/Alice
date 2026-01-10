import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { createSuccessEmbed, createErrorEmbed } from '../utils/embedHelper.js'

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Xóa một lượng tin nhắn nhất định.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Số lượng tin nhắn cần xóa (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages), // Vẫn giữ require permission gốc của Discord làm lớp bảo vệ đầu tiên
    async execute(interaction) {
        // Role check logic theo yêu cầu
        const memberRoles = interaction.member.roles.cache
        const hasAllowedRole = memberRoles.some(role => {
            const roleName = role.name.toLowerCase()
            return roleName.includes('admin') || roleName.includes('dev')
        })

        if (!hasAllowedRole) {
            return interaction.reply({
                embeds: [createErrorEmbed('Bạn không có quyền sử dụng lệnh này. Cần role **Admin** hoặc **Dev**.')],
                ephemeral: true
            })
        }

        const amount = interaction.options.getInteger('amount')

        await interaction.deferReply({ ephemeral: true })

        try {
            const deleted = await interaction.channel.bulkDelete(amount, true)
            const embed = createSuccessEmbed(`Đã xóa thành công ${deleted.size} tin nhắn.`)

            await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error(error)
            await interaction.editReply({
                embeds: [createErrorEmbed('Có lỗi xảy ra khi xóa tin nhắn. Có thể tin nhắn đã quá cũ (hơn 14 ngày).')]
            })
        }
    }
}
