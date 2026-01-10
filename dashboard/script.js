const API_URL = '/api';

// DOM Elements
const form = document.getElementById('knowledge-form');
const knowledgeList = document.getElementById('knowledge-list');
const totalEmbeddings = document.getElementById('total-embeddings');
const refreshBtn = document.getElementById('refresh-btn');

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
    });
});

// Initial load
loadKnowledge();
refreshBtn.onclick = loadKnowledge;
