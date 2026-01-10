import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Alice Helper - VibeCity RP')
      .setColor('#00FFCC')
      .setDescription('🏓 Pong!')
      .setFooter({ text: 'Alice - VibeCity - Vibe cao, City chất 😎' })
      .setTimestamp()

    await interaction.reply({ embeds: [embed] })
  }
}