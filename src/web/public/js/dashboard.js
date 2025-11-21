// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Load dashboard stats
    loadStats();

    // Refresh stats every 30 seconds
    setInterval(loadStats, 30000);
});

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        // Update bot status
        if (data.bot) {
            updateBotStatus(data.bot);
        }

        // Update dashboard cards
        updateElement('support-count', data.support?.open || 0);
        updateElement('verification-count', 0); // Placeholder
        updateElement('streamers-count', data.streamers?.approved || 0);
        updateElement('wallet-balance', (data.wallet?.totalBalance || 0).toLocaleString('ar-SA'));

        // Update quick stats
        updateElement('total-cases', data.support?.total || 0);
        updateElement('approved-streamers', data.streamers?.approved || 0);
        updateElement('total-users', data.wallet?.totalUsers || 0);

    } catch (error) {
        console.error('Error loading stats:', error);
        updateBotStatus(null);
    }
}

function updateBotStatus(botData) {
    const statusDot = document.getElementById('bot-status-dot');
    const statusText = document.getElementById('bot-status-text');
    
    if (!botData) {
        if (statusDot) {
            statusDot.style.color = '#e74c3c';
            statusText.textContent = 'غير متصل';
        }
        updateElement('bot-uptime', '-');
        updateElement('bot-guilds', '-');
        updateElement('bot-users', '-');
        updateElement('bot-ping', '-');
        return;
    }

    // Update status indicator
    if (statusDot && statusText) {
        if (botData.status === 'online') {
            statusDot.style.color = '#2ecc71';
            statusText.textContent = 'متصل';
        } else {
            statusDot.style.color = '#e74c3c';
            statusText.textContent = 'غير متصل';
        }
    }

    // Update bot info
    const uptime = formatUptime(botData.uptime || 0);
    updateElement('bot-uptime', uptime);
    updateElement('bot-guilds', botData.guilds || 0);
    updateElement('bot-users', botData.users || 0);
    updateElement('bot-ping', botData.ping ? `${botData.ping}ms` : '-');
}

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days} يوم ${hours} ساعة`;
    } else if (hours > 0) {
        return `${hours} ساعة ${minutes} دقيقة`;
    } else {
        return `${minutes} دقيقة`;
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('active');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    
    if (window.innerWidth <= 1024 && 
        sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !menuToggle.contains(e.target)) {
        sidebar.classList.remove('active');
    }
});
