// notifications.js - Global notification function
export function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    
    // Insert at the beginning so new notifications appear on top
    container.insertBefore(notif, container.firstChild);

    // Animate hide
    setTimeout(() => {
        notif.classList.add('hide');
        notif.addEventListener('transitionend', () => notif.remove());
    }, duration);
}