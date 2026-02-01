import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWarningEmbed, createErrorEmbed } from '../utils/embedHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIOLATIONS_FILE = path.join(__dirname, '../logs/violations.json');

// Đảm bảo file tồn tại
if (!fs.existsSync(VIOLATIONS_FILE)) {
    fs.mkdirSync(path.dirname(VIOLATIONS_FILE), { recursive: true });
    fs.writeFileSync(VIOLATIONS_FILE, JSON.stringify({}, null, 2));
}

/**
 * Lấy số lần vi phạm của người dùng
 */
const getViolationCount = (userId) => {
    const data = JSON.parse(fs.readFileSync(VIOLATIONS_FILE, 'utf-8'));
    return data[userId] || 0;
};

/**
 * Tăng số lần vi phạm
 */
const incrementViolation = (userId) => {
    const data = JSON.parse(fs.readFileSync(VIOLATIONS_FILE, 'utf-8'));
    data[userId] = (data[userId] || 0) + 1;
    fs.writeFileSync(VIOLATIONS_FILE, JSON.stringify(data, null, 2));
    return data[userId];
};

/**
 * Xử lý việc vi phạm nội dung
 */
export const handleViolation = async (message, toxicityResult, botData = null) => {
    const { level, reason } = toxicityResult;
    const userId = message.author.id;
    const violationCount = incrementViolation(userId);

    // Tính toán thời gian mute (phút)
    const levelMultiplier = level === 'high' ? 3 : (level === 'medium' ? 2 : 1);

    let muteMinutes = 0;
    if (violationCount > 1) {
        muteMinutes = (levelMultiplier * 2) + ((violationCount - 1) * 2);
        muteMinutes = Math.max(2, Math.min(15, muteMinutes));
    }

    try {
        const member = await message.guild.members.fetch(userId);
        const isSerious = level === 'high' || violationCount > 2;

        const statusTitle = violationCount === 1
            ? ` ${botData?.name || 'Bot'} - Nhắc Nhở `
            : (isSerious ? ` ${botData?.name || 'Bot'} - Lệnh Phạt Nặng ` : ` ${botData?.name || 'Bot'} - Cảnh Báo `);

        let description = `Chào ${message.author}, ${botData?.name || 'Bot'} nhận thấy tin nhắn của bạn không phù hợp.\n` +
            `- **Lý do:** ${reason}\n`;

        let embed;
        if (violationCount === 1) {
            description += `\n**Đây là lần nhắc nhở đầu tiên.** Hãy chú ý ngôn từ để tránh bị cấm chat nhé!`;
            embed = createWarningEmbed(description, botData);
        } else {
            let adminTag = '';
            if (message.guild) {
                const adminRoles = message.guild.roles.cache.filter(role =>
                    role.name.toLowerCase().includes('admin') ||
                    role.name.toLowerCase().includes('quản trị')
                );
                if (adminRoles.size > 0) {
                    adminTag = adminRoles.map(role => `<@&${role.id}>`).join(' ');
                }
            }

            if (member && member.moderatable) {
                const muteMs = muteMinutes * 60 * 1000;
                await member.timeout(muteMs, `Auto-mod: ${reason} (Lần ${violationCount})`);

                description += `- **Hình phạt:** Cấm chat **${muteMinutes} phút** (Vi phạm lần ${violationCount}).\n\n`;

                if (violationCount > 3 && adminTag) {
                    description += `**Báo cáo:** Người chơi này đã tái phạm nhiều lần. ${adminTag} vui lòng kiểm tra.\n\n`;
                }

                description += `*Hãy giữ cho môi trường văn minh nhé!*`;
                embed = isSerious ? createErrorEmbed(description, botData) : createWarningEmbed(description, botData);
            } else {
                description += `\n*Lưu ý: Bạn đang vi phạm quy tắc cộng đồng.*`;
                if (adminTag) {
                    description += `\n\n**Báo cáo Admin:** ${adminTag} có đối tượng vi phạm nhưng ${botData?.name || 'Alice'} không thể tự xử lý.`;
                }
                embed = createWarningEmbed(description, botData);
            }
        }

        embed.setTitle(statusTitle);
        await message.reply({ embeds: [embed] });
        // ... (remaining role assignment logic)

        // --- Bổ sung: Gán Role "Toxic Player" nếu vi phạm quá nhiều (>= 5 lần) ---
        if (violationCount >= 5 && message.guild) {
            try {
                let toxicRole = message.guild.roles.cache.find(r => r.name === 'Toxic Player');

                // Nếu chưa có role, cố gắng tạo (Yêu cầu bot có quyền Manage Roles)
                if (!toxicRole) {
                    toxicRole = await message.guild.roles.create({
                        name: 'Toxic Player',
                        color: '#FF0000',
                        reason: 'Tự động tạo cho mục đích kiểm duyệt của Alice'
                    }).catch(() => null);
                }

                if (toxicRole && member && !member.roles.cache.has(toxicRole.id)) {
                    await member.roles.add(toxicRole, `Vi phạm quá nhiều lần (${violationCount} lần)`);
                    console.log(`[MOD] Assigned 'Toxic Player' role to ${userId}`);
                }
            } catch (roleError) {
                console.error('Error assigning Toxic role:', roleError);
            }
        }

        return true; // Ngăn bot phản hồi AI sau đó
    } catch (error) {
        console.error('Error in handleViolation:', error);
    }
    return false;
};
