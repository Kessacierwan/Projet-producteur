document.addEventListener('DOMContentLoaded', function() {
    var stripe = Stripe(stripePublicKey);
    var elements = stripe.elements();
    var card = elements.create('card');
    card.mount('#card-element');

    var form = document.getElementById('payment-form');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const { clientSecret } = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }).then(r => r.json());

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: card }
        });

        if (result.error) {
            var errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
        } else {
            // Le paiement a réussi, appelez /confirm-payment et redirigez
            await fetch('/confirm-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentIntentId: result.paymentIntent.id })
            });
            window.location.href = '/confirmation';
        }
    });
});