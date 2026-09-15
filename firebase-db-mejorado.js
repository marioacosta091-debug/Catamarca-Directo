// ========================================
// CONFIGURACIÓN FIREBASE - DIRECTORIO CATAMARCA
// ========================================

const firebaseConfig = {
  apiKey: "AIzaSyC0K6VseoeZtU4WBGXM3d70BhcmgUC2WLk",
  authDomain: "catamarca-directas.firebaseapp.com",
  databaseURL: "https://catamarca-directas-default-rtdb.firebaseio.com",
  projectId: "catamarca-directas",
  storageBucket: "catamarca-directas.firebasestorage.app",
  messagingSenderId: "473572302526",
  appId: "1:473572302526:web:62d65c29814889e029c8ef"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ========================================
// FUNCIONES PRINCIPALES
// ========================================

/**
 * Guarda un profesional o negocio en la base de datos
 * @param {string} type - Tipo de item ('professional', 'business', etc)
 * @param {object} data - Datos del item
 * @returns {Promise} Referencia del item creado
 */
function saveItem(type, data) {
    if (!type || !data) {
        return Promise.reject(new Error('Type y data son requeridos'));
    }
    
    return db.ref(`${type}s`).push({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }).catch(error => {
        console.error(`Error guardando ${type}:`, error);
        throw error;
    });
}

/**
 * Obtiene todos los items de un tipo
 * @param {string} type - Tipo de item
 * @returns {Promise<Array>} Array de items con sus IDs
 */
function getItems(type) {
    if (!type) {
        return Promise.reject(new Error('Type es requerido'));
    }
    
    return db.ref(`${type}s`).once('value')
        .then(snapshot => {
            const data = snapshot.val();
            return data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
        })
        .catch(error => {
            console.error(`Error obteniendo ${type}s:`, error);
            throw error;
        });
}

/**
 * Obtiene un item específico
 * @param {string} type - Tipo de item
 * @param {string} id - ID del item
 * @returns {Promise<object>} El item con su ID
 */
function getItem(type, id) {
    if (!type || !id) {
        return Promise.reject(new Error('Type e id son requeridos'));
    }
    
    return db.ref(`${type}s/${id}`).once('value')
        .then(snapshot => {
            const data = snapshot.val();
            return data ? { id, ...data } : null;
        })
        .catch(error => {
            console.error(`Error obteniendo ${type} ${id}:`, error);
            throw error;
        });
}

/**
 * Actualiza un item existente
 * @param {string} type - Tipo de item
 * @param {string} id - ID del item
 * @param {object} data - Datos a actualizar
 * @returns {Promise}
 */
function updateItem(type, id, data) {
    if (!type || !id || !data) {
        return Promise.reject(new Error('Type, id y data son requeridos'));
    }
    
    return db.ref(`${type}s/${id}`).update({
        ...data,
        updatedAt: new Date().toISOString()
    }).catch(error => {
        console.error(`Error actualizando ${type} ${id}:`, error);
        throw error;
    });
}

/**
 * Elimina un item
 * @param {string} type - Tipo de item
 * @param {string} id - ID del item
 * @returns {Promise}
 */
function deleteItem(type, id) {
    if (!type || !id) {
        return Promise.reject(new Error('Type e id son requeridos'));
    }
    
    return db.ref(`${type}s/${id}`).remove()
        .catch(error => {
            console.error(`Error eliminando ${type} ${id}:`, error);
            throw error;
        });
}

/**
 * Agrega una reseña a un item
 * @param {string} type - Tipo de item
 * @param {string} itemId - ID del item
 * @param {object} review - Objeto con rating, comment, author
 * @returns {Promise}
 */
function addReview(type, itemId, review) {
    if (!type || !itemId || !review) {
        return Promise.reject(new Error('Type, itemId y review son requeridos'));
    }
    
    const reviewData = {
        ...review,
        rating: Math.max(1, Math.min(5, review.rating || 0)), // Valida rating entre 1-5
        createdAt: new Date().toISOString()
    };
    
    return db.ref(`${type}s/${itemId}/reviews`).push(reviewData)
        .catch(error => {
            console.error(`Error agregando reseña:`, error);
            throw error;
        });
}

/**
 * Obtiene todas las reseñas de un item
 * @param {string} type - Tipo de item
 * @param {string} itemId - ID del item
 * @returns {Promise<Array>} Array de reseñas
 */
function getReviews(type, itemId) {
    if (!type || !itemId) {
        return Promise.reject(new Error('Type e itemId son requeridos'));
    }
    
    return db.ref(`${type}s/${itemId}/reviews`).once('value')
        .then(snapshot => {
            const data = snapshot.val();
            return data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })) : [];
        })
        .catch(error => {
            console.error(`Error obteniendo reseñas:`, error);
            throw error;
        });
}

/**
 * Busca items por nombre (case-insensitive)
 * @param {string} type - Tipo de item
 * @param {string} searchTerm - Término de búsqueda
 * @returns {Promise<Array>} Items que coinciden
 */
function searchItems(type, searchTerm) {
    if (!type || !searchTerm) {
        return Promise.reject(new Error('Type y searchTerm son requeridos'));
    }
    
    return getItems(type).then(items => {
        const term = searchTerm.toLowerCase();
        return items.filter(item => 
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.description && item.description.toLowerCase().includes(term))
        );
    });
}

/**
 * Obtiene items filtrados por categoría
 * @param {string} type - Tipo de item
 * @param {string} category - Categoría a filtrar
 * @returns {Promise<Array>} Items de esa categoría
 */
function getItemsByCategory(type, category) {
    if (!type || !category) {
        return Promise.reject(new Error('Type y category son requeridos'));
    }
    
    return getItems(type).then(items => 
        items.filter(item => item.category === category)
    );
}

/**
 * Calcula el rating promedio de un item
 * @param {string} type - Tipo de item
 * @param {string} itemId - ID del item
 * @returns {Promise<number>} Rating promedio
 */
function getAverageRating(type, itemId) {
    if (!type || !itemId) {
        return Promise.reject(new Error('Type e itemId son requeridos'));
    }
    
    return getReviews(type, itemId).then(reviews => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + (review.rating || 0), 0);
        return Math.round((sum / reviews.length) * 10) / 10;
    });
}

/**
 * Obtiene estadísticas de un item
 * @param {string} type - Tipo de item
 * @param {string} itemId - ID del item
 * @returns {Promise<object>} Objeto con stats
 */
function getItemStats(type, itemId) {
    if (!type || !itemId) {
        return Promise.reject(new Error('Type e itemId son requeridos'));
    }
    
    return getReviews(type, itemId).then(reviews => ({
        reviewCount: reviews.length,
        averageRating: reviews.length === 0 ? 0 : 
            Math.round((reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length) * 10) / 10
    }));
}

/**
 * Limpia todos los listeners de Firebase
 */
function cleanupFirebaseListeners() {
    db.ref().off();
    console.log('✓ Listeners de Firebase desconectados');
}

/**
 * Obtiene el estado de conexión a Firebase
 * @returns {Promise<boolean>} True si está conectado
 */
function checkConnection() {
    return db.ref('.info/connected').once('value')
        .then(snapshot => snapshot.val())
        .catch(() => false);
}
