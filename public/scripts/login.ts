// @ts-nocheck
// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
    const credentialForm = document.getElementById('form-credentials');
    const playerIdForm = document.getElementById('form-playerId');
    const credentialErrorDiv = document.getElementById('credential-error');
    const playerIdErrorDiv = document.getElementById('playerId-error');

    const displayError = (errorDiv, message) => {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    };

    const clearError = (errorDiv) => {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    };

    if (credentialForm) {
        credentialForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearError(credentialErrorDiv);

            const username = credentialForm.username.value;
            const password = credentialForm.password.value;

            if (!username || !password) {
                displayError(credentialErrorDiv, 'Please enter both username and password.');
                return;
            }

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    window.location.href = '/me'; // Redirect to private dashboard on success
                } else {
                    const errorData = await response.json();
                    displayError(credentialErrorDiv, errorData.message || 'Login failed.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                displayError(credentialErrorDiv, 'An unexpected error occurred. Please try again.');
            }
        });
    }

    if (playerIdForm) {
        playerIdForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            clearError(playerIdErrorDiv);

            const playerId = playerIdForm.playerId.value;

            if (!playerId) {
                displayError(playerIdErrorDiv, 'Please enter your Player Support ID.');
                return;
            }

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ playerId }),
                });

                if (response.ok) {
                    window.location.href = '/me'; // Redirect to private dashboard on success
                } else {
                    const errorData = await response.json();
                    displayError(playerIdErrorDiv, errorData.message || 'Login failed.');
                }
            } catch (error) {
                console.error('Error during login:', error);
                displayError(playerIdErrorDiv, 'An unexpected error occurred. Please try again.');
            }
        });
    }
});
