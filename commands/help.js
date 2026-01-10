import { SlashCommandBuilder } from 'discord.js'
import { createSuccessEmbed } from '../utils/embedHelper.js'

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Hiển thị danh sách các lệnh khả dụng.'),
    async execute(interaction) {
        await interaction.deferReply()
        const commands = interaction.client.commands

        // Nhóm lệnh
        const utilityCmds = ['help', 'userinfo', 'serverinfo', 'ping']
        const modCmds = ['clear', 'mute'] // Added mute

        const formatCmd = (name) => {
            const cmd = commands.get(name)
            return `**/${name}**: ${cmd ? cmd.data.description : 'Không có mô tả'}`
        }

        const description = `
**🛠️ Tiện Ích**
${utilityCmds.map(formatCmd).join('\n')}

**🛡️ Quản Trị**
${modCmds.map(formatCmd).join('\n')}
    `.trim()

        const embed = createSuccessEmbed(description)
            .setTitle('📚 Danh Sách Lệnh Của Alice')

        await interaction.editReply({ embeds: [embed] })
    }
}
