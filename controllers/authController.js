import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../services/models.js';

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );

    return { accessToken, refreshToken };
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không chính xác' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Lưu refresh token vào DB
        user.refreshToken = refreshToken;
        await user.save();

        // Gửi refresh token qua cookie bảo mật
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });

        res.json({
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
    }
};

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Không tìm thấy refresh token' });
        }

        const user = await User.findOne({ refreshToken });
        if (!user) {
            return res.status(403).json({ error: 'Refresh token không hợp lệ' });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ error: 'Refresh token đã hết hạn hoặc không hợp lệ' });

            const tokens = generateTokens(user);

            // Cập nhật refresh token mới (Optional: Token Rotation)
            user.refreshToken = tokens.refreshToken;
            user.save();

            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({ accessToken: tokens.accessToken });
        });
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Lỗi server khi refresh token' });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const user = await User.findOne({ refreshToken });
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }

        res.clearCookie('refreshToken');
        res.json({ success: true, message: 'Đăng xuất thành công' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Lỗi server khi đăng xuất' });
    }
};
