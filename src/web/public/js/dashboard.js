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
