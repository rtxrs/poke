// @ts-nocheck
// @ts-nocheck
/**
 * Shared utility functions for Pokemon GO Dashboard
 */

function stringToHslColor(str, s, l) {
    if (!str) return `hsl(0, 0%, 80%)`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function generateGradient(id) {
    if (!id) return '#eee';
    const color1 = stringToHslColor(id, 80, 75);
    const color2 = stringToHslColor(id.split('').reverse().join(''), 90, 70);
    const color3 = stringToHslColor(id + '-v2', 70, 80);
    return `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`;
}

function renderPlayerBadge(player) {
    if (!player || !player.userId) {
        // Fallback for missing ID
        return `<span class="player-badge" style="background: #eee; color: #333;">${player.name || 'N/A'}</span>`;
    }
    const gradient = generateGradient(player.publicId);
    return `<span class="player-badge" style="background: ${gradient};">#${player.userId}</span>`;
}

// Make functions available globally
window.stringToHslColor = stringToHslColor;
window.generateGradient = generateGradient;
window.renderPlayerBadge = renderPlayerBadge;
