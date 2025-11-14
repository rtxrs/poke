async function checkLoginStatus() {
    try {
        const response = await fetch('/api/check-auth-status'); // Assuming this endpoint exists
        if (!response.ok) {
            // If the response is not OK, assume not logged in or an error occurred
            return { loggedIn: false };
        }
        const data = await response.json();
        return data; // Expects { loggedIn: true/false, username: "..." }
    } catch (error) {
        console.error('Error checking login status:', error);
        return { loggedIn: false }; // Assume not logged in on error
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        try {
            const response = await fetch('/components/header.html');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const headerHtml = await response.text();
            headerPlaceholder.innerHTML = headerHtml;

            // Load sub-header
            const subheaderPlaceholder = document.getElementById('subheader-placeholder');
            if (subheaderPlaceholder) {
                try {
                    const subheaderResponse = await fetch('/components/subheader.html');
                    if (subheaderResponse.ok) {
                        subheaderPlaceholder.innerHTML = await subheaderResponse.text();
                    }
                } catch (error) {
                    console.error('Failed to load sub-header:', error);
                }
            }

            const mainTitle = document.getElementById('main-title');
            const navHome = document.getElementById('nav-home');
            const navLogin = document.getElementById('nav-login');
            const navRegister = document.getElementById('nav-register');
            const navDashboard = document.getElementById('nav-dashboard');
            const navLogout = document.getElementById('nav-logout');
            const mainHeader = document.querySelector('.main-header');

            // Helper to set link visibility
            const setLinkVisibility = (home = false, login = false, register = false, dashboard = false, logout = false) => {
                if (navHome) navHome.parentElement.style.display = home ? 'block' : 'none';
                if (navLogin) navLogin.parentElement.style.display = login ? 'block' : 'none';
                if (navRegister) navRegister.parentElement.style.display = register ? 'block' : 'none';
                if (navDashboard) navDashboard.parentElement.style.display = dashboard ? 'block' : 'none';
                if (navLogout) navLogout.parentElement.style.display = logout ? 'block' : 'none';
            };

            const path = window.location.pathname;
            const authStatus = await checkLoginStatus();

            // Function to mask username
            const maskUsername = (username) => {
                if (!username || username.length <= 2) {
                    return username;
                }
                return username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
            };

            // Determine background color for body and header based on login status and team
            const body = document.body;
            body.classList.remove('default-bg', 'team-valor-bg', 'team-mystic-bg', 'team-instinct-bg');
            if (mainHeader) {
                mainHeader.classList.remove('default-bg', 'team-valor-bg', 'team-mystic-bg', 'team-instinct-bg');
            }

            if (authStatus.loggedIn && authStatus.team) {
                switch (authStatus.team) {
                    case 1: // Team Mystic
                        body.classList.add('team-mystic-bg');
                        if (mainHeader) mainHeader.classList.add('team-mystic-bg');
                        break;
                    case 2: // Team Valor
                        body.classList.add('team-valor-bg');
                        if (mainHeader) mainHeader.classList.add('team-valor-bg');
                        break;
                    case 3: // Team Instinct
                        body.classList.add('team-instinct-bg');
                        if (mainHeader) mainHeader.classList.add('team-instinct-bg');
                        break;
                    default:
                        body.classList.add('default-bg');
                        if (mainHeader) mainHeader.classList.add('default-bg');
                        break;
                }
            } else {
                body.classList.add('default-bg');
                if (mainHeader) mainHeader.classList.add('default-bg');
            }

            if (path.includes('health-check.html')) {
                if (mainTitle) mainTitle.textContent = 'Service Health';
                setLinkVisibility(true, false, false, false, false); // Home only
                if (subheaderPlaceholder) {
                    subheaderPlaceholder.remove();
                }
            } else if (path === '/' || path.includes('index.html')) {
                if (authStatus.loggedIn) {
                    setLinkVisibility(false, false, false, true, true); // Dashboard, Logout
                } else {
                    setLinkVisibility(false, true, true, false, false); // Login, Register
                }
            } else if (path.includes('login.html')) {
                if (mainTitle) mainTitle.textContent = 'Login';
                setLinkVisibility(true, false, true, false, false); // Home, Register
            } else if (path.includes('register.html')) {
                if (mainTitle) mainTitle.textContent = 'Register';
                setLinkVisibility(true, true, false, false, false); // Home, Login
            } else if (path.includes('/me') || path.includes('private.html')) {
                setLinkVisibility(true, false, false, false, true); // Home, Logout
            }

            // All visibility is set, now make the nav visible to prevent FOUC
            const headerNav = document.querySelector('.header-nav');
            if (headerNav) {
                headerNav.classList.add('nav-ready');
            }

            // --- Burger Menu Logic ---
            const burgerMenu = document.querySelector('.burger-menu');
            const mainNav = document.querySelector('.main-nav');

            if (burgerMenu && mainNav) {
                burgerMenu.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mainNav.classList.toggle('open');
                });

                // Close menu when a link inside is clicked
                mainNav.addEventListener('click', (e) => {
                    if (e.target.classList.contains('nav-link')) {
                        mainNav.classList.remove('open');
                    }
                });
            }
            
            // Close menu when clicking outside of it
            document.addEventListener('click', (e) => {
                if (mainNav && mainNav.classList.contains('open')) {
                    const isClickInsideNav = mainNav.contains(e.target);
                    const isClickOnBurger = burgerMenu.contains(e.target);
                    if (!isClickInsideNav && !isClickOnBurger) {
                        mainNav.classList.remove('open');
                    }
                }
            });

        } catch (error) {
            console.error('loadHeader.js: Failed to load header:', error);
        }
    }
});
