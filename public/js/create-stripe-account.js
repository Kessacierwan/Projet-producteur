document.addEventListener('DOMContentLoaded', function() {
    const createAccountButton = document.getElementById('create-stripe-account');
    const statusMessage = document.getElementById('status-message');

    createAccountButton.addEventListener('click', async function() {

        try {
            const response = await fetch('/api/create-stripe-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.accountLink) {
                window.location.href = data.accountLink;
            } else {
                statusMessage.textContent = data.error || 'Une erreur est survenue';
            }
        } catch (error) {
            statusMessage.textContent = 'Une erreur est survenue lors de la création du compte';
        }
    });
});