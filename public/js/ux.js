    document.addEventListener('DOMContentLoaded', function() {
        const addPanierForms = document.querySelectorAll(".bp-add-to-cart-form");
        
        addPanierForms.forEach(form => {
            form.addEventListener("submit", async function(event) {
                event.preventDefault();

                const button = this.querySelector('.bp-add-to-cart-button');
                const productItem = this.closest('.bp-product-item');
                const quantityDisplay = productItem.querySelector('.bp-product-quantity');
                const productId = this.action.split('/').pop(); // Extrait l'ID du produit de l'URL du formulaire
                const quantity = this.querySelector('input[name="quantite"]').value;
                
                // Effet visuel pour le feedback utilisateur
                button.style.backgroundColor = "lightgreen";
                productItem.style.border = "2px solid lightgreen";
                
                try {
                    const response = await fetch(this.action, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ quantite: quantity }),
                        credentials: 'include'
                    });

                    const data = await response.json();

                    if (data.success) {
                        console.log(data.message);
                        if (data.nouvelleQuantite !== undefined) {
                            quantityDisplay.textContent = `Quantité : ${data.nouvelleQuantite} Kg`;
                        }
                        updatePanierDisplay(data.panier, data.totalQty);
                        showConfirmationMessage(data.message);
                    } else {
                        console.error(data.error);
                        showConfirmationMessage(data.error, true);
                    }
                } catch (error) {
                    console.error('Erreur:', error);
                    showConfirmationMessage('Une erreur est survenue lors de l\'ajout au panier', true);
                } finally {
                    setTimeout(() => {
                        button.style.backgroundColor = "";
                        productItem.style.border = "";
                    }, 2000);
                }
            });
        });
    });

    function updatePanierDisplay(panier, totalQty) {
        const panierCount = document.querySelector('.cart-count');
        if (panierCount) {
            panierCount.textContent = `(${totalQty})`;
        }
    }

    function showConfirmationMessage(message, isError = false) {
        const confirmationElement = document.createElement('div');
        confirmationElement.textContent = message;
        confirmationElement.className = isError ? 'error-message' : 'confirmation-message';
        confirmationElement.style.position = 'fixed';
        confirmationElement.style.top = '20px';
        confirmationElement.style.right = '20px';
        confirmationElement.style.padding = '10px';
        confirmationElement.style.backgroundColor = isError ? '#ffcccc' : '#ccffcc';
        confirmationElement.style.border = `1px solid ${isError ? '#ff0000' : '#00ff00'}`;
        confirmationElement.style.borderRadius = '5px';
        document.body.appendChild(confirmationElement);
        setTimeout(() => confirmationElement.remove(), 3000);
    }