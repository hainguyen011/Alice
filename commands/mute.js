import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'
import { createSuccessEmbed, createErrorEmbed } from '../utils/embedHelper.js'

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Cấm chat (Timeout) một thành viên.')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Thành viên cần mute')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Thời gian cấm chat (tính bằng giây)')
                .setMinValue(1)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Lý do cấm chat'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
        // 1. Role Check (Admin/Dev)
        const executorRoles = interaction.member.roles.cache
        const hasAllowedRole = executorRoles.some(role => {
            const roleName = role.name.toLowerCase()
            return roleName.includes('admin') || roleName.includes('dev')
        })

        if (!hasAllowedRole) {
            return interaction.reply({
                embeds: [createErrorEmbed('Bạn không có quyền sử dụng lệnh này. Cần role **Admin** hoặc **Dev**.')],
                ephemeral: true
            })
        }

        // 2. Get Input
        const targetUser = interaction.options.getUser('target')
        const durationSeconds = interaction.options.getInteger('duration')
        const reason = interaction.options.getString('reason') || 'Không có lý do'

        // 3. Fetch Member
        const member = await interaction.guild.members.fetch(targetUser.id)

        if (!member) {
            return interaction.reply({ embeds: [createErrorEmbed('Không tìm thấy thành viên này trong server.')], ephemeral: true })
        }

        // 4. Validate Hierarchy (Cannot mute bot or higher roles usually, handled by Discord catch)
        if (!member.moderatable) {
            return interaction.reply({ embeds: [createErrorEmbed('Tôi không thể mute thành viên này (Họ có quyền cao hơn tôi hoặc là Admin).')], ephemeral: true })
        }

        // 5. Execute Timeout
        await interaction.deferReply()
        try {
            await member.timeout(durationSeconds * 1000, reason)

            const embed = createSuccessEmbed(`Đã mute **${targetUser.tag}** trong **${durationSeconds}s**.\nLý do: ${reason}`)
            await interaction.editReply({ embeds: [embed] })
        } catch (error) {
            console.error(error)
            await interaction.editReply({ embeds: [createErrorEmbed('Có lỗi xảy ra khi thực hiện lệnh mute.')] }) // Non-ephemeral since deferred as public
        }
    }
}
