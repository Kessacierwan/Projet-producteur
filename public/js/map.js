const map = L.map('map').setView([43.2841, 5.5763], 13);

// Charger les tuiles de la carte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Fonction pour calculer la distance entre deux points en km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
}

// Fonction pour obtenir la position de l'utilisateur
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
                error => reject(error)
            );
        } else {
            reject(new Error("La géolocalisation n'est pas supportée par ce navigateur."));
        }
    });
}

// Fonction pour ajouter un délai
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour effectuer une requête avec nouvelle tentative
async function fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);

            return await response.json();
        } catch (e) {
            if (i === maxRetries - 1)
                throw e;

            await delay(1000); // Attendre 1 seconde avant de réessayer
        }
    }
}

// Fonction pour afficher les producteurs sur la carte
async function displayProducers(maxDistance, bioPreference) {
    let producteursCorrespondants = [];

    // Vider la carte des anciens marqueurs
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    let userLocation;
    try {
        userLocation = await getUserLocation();
        map.setView([userLocation.lat, userLocation.lon], 13);
    } catch (error) {
        console.error("Impossible d'obtenir la position de l'utilisateur, utilisation de la position par défaut:", error);
        userLocation = { lat: 43.2841, lon: 5.5763 };
    }

    // Ajouter un marqueur pour la position de l'utilisateur
    L.marker([userLocation.lat, userLocation.lon]).addTo(map).bindPopup('Vous êtes ici').openPopup();

    // Utiliser Promise.all pour attendre que toutes les requêtes de géocodage soient terminées
    const producteurPromises = producteurs.map(async (producteur, index) => {
        await delay(index * 1000); // Ajouter un délai croissant pour chaque requête
        const adresse = `${producteur.adresse}, France`; // Ajouter le pays pour améliorer la précision

        try {
            const data = await fetchWithRetry(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(adresse)}`);
            if (data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);

                // Calculer la distance
                const distance = calculateDistance(userLocation.lat, userLocation.lon, lat, lon);

                // Vérifier si la distance est inférieure ou égale à la distance maximale et si le bio correspond à la préférence
                if (distance <= maxDistance && (bioPreference === 'indifferent' || bioPreference === producteur.bio.toString())) {
                    L.marker([lat, lon]).addTo(map).bindPopup(`${producteur.nom}<br>Distance: ${distance.toFixed(2)} km<br>Bio: ${producteur.bio ? 'Oui' : 'Non'}<br><a href="/boutique/${producteur.id}">Boutique</a>`);

                    return { ...producteur, distance: distance };
                }
            } else {
                console.warn("Adresse non trouvée : " + adresse);
            }
        } catch (error) {
            console.error('Erreur pour l\'adresse ' + adresse + ':', error);
        }
        return null;
    });

    // Attendre que toutes les promesses soient résolues
    const results = await Promise.all(producteurPromises);

    // Filtrer les résultats null et les ajouter au tableau des producteurs correspondants
    producteursCorrespondants = results.filter(result => result !== null);

    console.log("Producteurs correspondants :", producteursCorrespondants);

    // Créer et afficher les éléments HTML pour chaque producteur
    const producteursContainer = document.createElement('div');
    producteursContainer.id = 'producteurs-list';
    producteursContainer.className = 'producteurs-container';

    producteursCorrespondants.forEach(producteur => {
        const producteurElement = document.createElement('div');
        producteurElement.className = 'producteur-item';
        producteurElement.innerHTML = `
            <h3>${producteur.nom}</h3>
            <p>Adresse: ${producteur.adresse}</p>
            <p>Distance: ${producteur.distance.toFixed(2)} km</p>
            <p>Bio: ${producteur.bio}</p>
            <a href="/boutique/${producteur.id}">Boutique</a>
        `;
        producteursContainer.appendChild(producteurElement);
    });

    // Remplacer l'ancien conteneur de producteurs s'il existe
    const existingContainer = document.getElementById('producteurs-list');
    if (existingContainer) {
        existingContainer.replaceWith(producteursContainer);
    } else { 
        document.getElementById('map').after(producteursContainer);
    }
    
    return producteursCorrespondants;
}

// Écouter les changements sur le sélecteur de distance et de préférence bio
document.getElementById('distance').addEventListener('change', function () {
    const maxDistance = parseInt(this.value);
    const bioPreference = document.getElementById('preference').value;
    displayProducers(maxDistance, bioPreference);
});

document.getElementById('preference').addEventListener('change', function () {
    const maxDistance = parseInt(document.getElementById('distance').value);
    const bioPreference = this.value;
    displayProducers(maxDistance, bioPreference);
});

// Afficher les producteurs par défaut avec une distance maximale et la préférence bio par défaut
displayProducers(parseInt(document.getElementById('distance').value), document.getElementById('preference').value);