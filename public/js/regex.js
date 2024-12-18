const motDePasse = document.getElementById('motDePasse');

motDePasse.addEventListener('input', function() {
    const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*\-²])[a-zA-Z0-9!@#$%^&*\-²]{8,}$/

;
    if (regex.test(this.value)) {
        this.setCustomValidity('');
    } else {
        this.setCustomValidity('Le mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 chiffre et 1 caractère spécial.');
    }
});