const API_URL = '/api';

// DOM Elements
const form = document.getElementById('knowledge-form');
const knowledgeList = document.getElementById('knowledge-list');
const totalEmbeddings = document.getElementById('total-embeddings');
const refreshBtn = document.getElementById('refresh-btn');
const conversationList = document.getElementById('conversation-list');
const refreshConvBtn = document.getElementById('refresh-conv-btn');
const syncDiscordBtn = document.getElementById('sync-discord-btn');

/**
 * Hiển thị thông báo
 */
function showToast(message, color = '#00f2ff') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.borderLeftColor = color;
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

/**
 * Tải danh sách kiến thức
 */
async function loadKnowledge() {
    try {
        const response = await fetch(`${API_URL}/knowledge`);
        const data = await response.json();

        totalEmbeddings.textContent = data.length;
        renderList(data);
    } catch (error) {
        console.error('Error loading knowledge:', error);
        showToast('Lỗi tải dữ liệu!', '#f85149');
    }
}

/**
 * Render danh sách ra giao diện (txAdmin style Table)
 */
function renderList(items) {
    if (items.length === 0) {
        knowledgeList.innerHTML = '<div class="p-4 text-center text-muted">Chưa có tri thức nào được nạp.</div>';
        return;
    }

    knowledgeList.innerHTML = items.map(item => `
        <div class="knowledge-item">
            <div class="k-info">
                <div class="k-title">${item.payload.title || 'Untitled Document'}</div>
                <div class="k-content">${item.payload.content}</div>
            </div>
            <div class="k-actions">
                <button class="btn-delete-tx" onclick="deleteItem('${item.id}')" title="Xóa tri thức">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// File Upload Elements
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const uploadZone = document.getElementById('upload-zone');

/**
 * Xử lý khi chọn file
 */
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        fileNameDisplay.style.color = '#39FF14';
        handleFileUpload(file);
    }
});

/**
 * Logic upload file lên server
 */
async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        showToast('Đang tải lên và embedding file...', '#bc13fe');
        const response = await fetch(`${API_URL}/knowledge/upload`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            showToast('Đã nạp file thành công!');
            fileInput.value = '';
            fileNameDisplay.textContent = 'Chưa có file nào được chọn';
            fileNameDisplay.style.color = '#8b949e';
            loadKnowledge();
        } else {
            const err = await response.json();
            throw new Error(err.error || 'Upload failed');
        }
    } catch (error) {
        showToast(`Lỗi: ${error.message}`, '#f85149');
    }
}

/**
 * Thêm kiến thức mới (Manual)
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    try {
        showToast('Đang embedding...', '#bc13fe');
        const response = await fetch(`${API_URL}/knowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });

        if (response.ok) {
            showToast('Đã thêm thành công!');
            form.reset();
            loadKnowledge();
        }
    } catch (error) {
        showToast('Lỗi khi thêm dữ liệu!', '#f85149');
    }
});

/**
 * Xóa kiến thức
 */
async function deleteItem(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa kiến thức này không?')) return;

    try {
        const response = await fetch(`${API_URL}/knowledge/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Đã xóa!');
            loadKnowledge();
        }
    } catch (error) {
        showToast('Lỗi khi xóa!', '#f85149');
    }
}

/**
 * Tải danh sách hội thoại
 */
async function loadConversations() {
    try {
        const response = await fetch(`${API_URL}/conversations`);
        const data = await response.json();
        renderConversations(data);
    } catch (error) {
        console.error('Error loading conversations:', error);
        showToast('Lỗi tải cuộc hội thoại!', '#f85149');
    }
}

/**
 * Render danh sách hội thoại
 */
function renderConversations(items) {
    if (items.length === 0) {
        conversationList.innerHTML = '<div class="p-4 text-center text-muted">Chưa có cuộc hội thoại nào được ghi lại.</div>';
        return;
    }

    conversationList.innerHTML = items.map(item => {
        const date = new Date(item.timestamp).toLocaleString('vi-VN');
        return `
        <div class="conversation-item">
            <div class="conv-header">
                <div class="conv-user">
                    <span class="user-tag"><i class="fas fa-user"></i> ${item.username}</span>
                    <small class="text-muted">ID: ${item.userId}</small>
                </div>
                <div class="conv-time">${date}</div>
            </div>
            <div class="conv-body">
                <div class="msg-bubble msg-user">
                    <span class="msg-label">${item.username}</span>
                    ${item.message}
                </div>
                <div class="msg-bubble msg-alice">
                    <span class="msg-label">Alice</span>
                    ${item.response}
                </div>
            </div>
        </div>
    `}).join('');
}

/**
 * Đồng bộ từ Discord
 */
async function syncFromDiscord() {
    try {
        syncDiscordBtn.disabled = true;
        syncDiscordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đồng bộ...';
        showToast('Đang quét tin nhắn từ Discord...', '#337ab7');

        const response = await fetch(`${API_URL}/conversations/sync`, { method: 'POST' });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error(`Server returned non-JSON response (HTML). Vui lòng khởi động lại server hoặc kiểm tra log terminal.`);
        }

        if (data.success) {
            showToast(`Đã đồng bộ thành công ${data.count} cuộc hội thoại mới!`, '#5cb85c');
            loadConversations();
        } else {
            throw new Error(data.error || 'Đồng bộ thất bại');
        }
    } catch (error) {
        console.error('Sync error:', error);
        showToast(`Lỗi đồng bộ: ${error.message}`, '#f85149');
    } finally {
        syncDiscordBtn.disabled = false;
        syncDiscordBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Đồng bộ từ Discord';
    }
}

/**
 * Xử lý chuyển đổi Tab (Sidebar Navigation)
 */
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('page-title');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = item.getAttribute('data-tab');

        // Cập nhật trạng thái sidebar
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // Hiển thị nội dung tương ứng
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `tab-${targetTab}`) {
                content.classList.add('active');
            }
        });

        // Cập nhật tiêu đề trang
        pageTitle.textContent = item.textContent.trim();

        // Nếu chuyển sang tab Knowledge, load lại dữ liệu
        if (targetTab === 'knowledge') {
            loadKnowledge();
        }

        // Nếu chuyển sang tab Conversations, load lại dữ liệu
        if (targetTab === 'conversations') {
            loadConversations();
        }
    });
});

// Initial load
loadKnowledge();
refreshBtn.onclick = loadKnowledge;
refreshConvBtn.onclick = loadConversations;
syncDiscordBtn.onclick = syncFromDiscord;
