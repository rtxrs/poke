/**
 * This script fetches and displays Pokemon GO events in the public dashboard.
 */
async function loadEvents() {
    const eventsContainer = document.getElementById('events-container');
    const API_URL = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json';

    const EVENT_COLORS = {
        'community-day': '#1660a9',
        'raid-day': '#e74c3c',
        'raid-battles': '#c0392b',
        'event': '#27ae60',
        'raid-hour': '#c0392b',
        'research': '#1abc9c',
        'timed-research': '#1abc9c',
        'limited-research': '#159e83',
        'live-event': '#d63031',
        'pokemon-go-fest': '#153d94',
        'research-breakthrough': '#795548',
        'special-research': '#13a185',
        'global-challenge': '#0a64b5',
        'go-rocket-takeover': '#1e1e1e',
        'team-go-rocket': '#1e1e1e',
        'giovanni-special-research': '#1e272e',
        'safari-zone': '#3d7141',
        'ticketed-event': '#de3e9b',
        'go-battle-league': '#8e44ad',
        'pokemon-spotlight-hour': '#e58e26',
        'bonus-hour': '#40407a',
        'update': '#2980b9',
        'raid-weekend': '#6f1e51',
        'potential-ultra-unlock': '#2c3e50',
        'location-specific': '#284b92',
        'season': '#38ada9',
        'elite-raids': '#a21416',
        'pokemon-go-tour': '#1d3a74',
        'pokestop-showcase': '#ff9f43',
        'default': '#bdc3c7'
    };

    function getTimeRemaining(endTime) {
        const total = Date.parse(endTime) - Date.parse(new Date());
        if (total <= 0) return null;
        
        const days = Math.floor(total / (1000 * 60 * 60 * 24));
        const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((total / 1000 / 60) % 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const events = await response.json();
        const now = new Date();

        const activeEvents = [];
        const upcomingEvents = [];

        events.forEach(event => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            if (now >= start && now <= end) {
                activeEvents.push(event);
            } else if (now < start) {
                upcomingEvents.push(event);
            }
        });

        // Sort upcoming by start date
        upcomingEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
        // Sort active by end date
        activeEvents.sort((a, b) => new Date(a.end) - new Date(b.end));

        if (activeEvents.length === 0 && upcomingEvents.length === 0) {
            eventsContainer.innerHTML = '<p class="no-events">No active or upcoming events found.</p>';
            return;
        }

        const renderEvent = (event, isUpcoming) => {
            const start = new Date(event.start);
            const end = new Date(event.end);
            const statusText = isUpcoming ? 'Starts in' : 'Ends in';
            const timer = getTimeRemaining(isUpcoming ? event.start : event.end);
            const color = EVENT_COLORS[event.eventType] || EVENT_COLORS['default'];

            return `
                <div class="event-item">
                    <div class="event-dot" style="background-color: ${color}"></div>
                    <div class="event-info">
                        <span class="event-name" title="${event.name}">${event.name}</span>
                        <span class="event-timer">${statusText} ${timer}</span>
                    </div>
                </div>
            `;
        };

        let html = '';
        if (activeEvents.length > 0) {
            html += '<h3 class="events-section-header">Ongoing</h3>';
            html += activeEvents.map(e => renderEvent(e, false)).join('');
        }
        if (upcomingEvents.length > 0) {
            html += '<h3 class="events-section-header">Upcoming</h3>';
            html += upcomingEvents.map(e => renderEvent(e, true)).join('');
        }

        eventsContainer.innerHTML = html;

    } catch (error) {
        console.error('Error loading events:', error);
        eventsContainer.innerHTML = '<p class="error-message">Error loading events.</p>';
    }
}

// Initial load
document.addEventListener('DOMContentLoaded', loadEvents);
// Refresh every 5 minutes
setInterval(loadEvents, 5 * 60 * 1000);
