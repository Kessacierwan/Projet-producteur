function deleteProduct(productId) {
    fetch(`/deleteProduct/${productId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
             // Supprimer l'élément du DOM
             const productElement = document.querySelector(`[data-product-id="${productId}"]`);
             if (productElement) {
                 productElement.remove();
             }
            // Afficher un message de succès
            console.log(data.message);
        } else {
            // Afficher un message d'erreur
            console.log(data.message);
        }
    })
    .catch(error => {
        console.log('Erreur:', error);
        console.log("Une erreur est survenue lors de la suppression du produit");
    });
}

document.querySelectorAll('.delete-product-button').forEach(button => {
    button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        deleteProduct(productId);
    });
});