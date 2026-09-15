// Estado de la aplicación
let allProfessionals = [];
let allBusinesses = [];
let currentFilter = 'all';
let currentCategory = null;
let searchTerm = '';

// Elementos del DOM
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const detailModal = document.getElementById('detailModal');
const filterBtns = document.querySelectorAll('.filter-btn');
const categoriesContainer = document.getElementById('categoriesContainer');

// Event Listeners
searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    render();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', e => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        currentCategory = null;
        renderCategories();
        render();
    });
});

// Obtener todas las categorías
function getAllCategories() {
    const categories = new Set();
    
    if (currentFilter === 'all' || currentFilter === 'professional') {
        allProfessionals.forEach(p => categories.add(p.category));
    }
    
    if (currentFilter === 'all' || currentFilter === 'business') {
        allBusinesses.forEach(b => categories.add(b.category));
    }
    
    return Array.from(categories).sort();
}

// Renderizar categorías
function renderCategories() {
    const categories = getAllCategories();
    categoriesContainer.innerHTML = '<button class="category-btn active" data-category="">Todas las categorías</button>';
    
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = category;
        btn.dataset.category = category;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = category;
            render();
        });
        categoriesContainer.appendChild(btn);
    });
}

// Filtrar resultados
function getFilteredResults() {
    let results = [];
    
    if (currentFilter === 'all' || currentFilter === 'professional') {
        results = results.concat(allProfessionals);
    }
    
    if (currentFilter === 'all' || currentFilter === 'business') {
        results = results.concat(allBusinesses);
    }
    
    // Filtrar por categoría
    if (currentCategory) {
        results = results.filter(r => r.category === currentCategory);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter(r => 
            r.name.toLowerCase().includes(term) ||
            (r.oficio && r.oficio.toLowerCase().includes(term)) ||
            r.category.toLowerCase().includes(term) ||
            (r.specialties && r.specialties.some(s => s.toLowerCase().includes(term)))
        );
    }
    
    return results;
}

// Renderizar tarjetas de resultados
function render() {
    const results = getFilteredResults();
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state">No encontramos resultados. Intenta otro término.</div>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(item => `
        <div class="result-card ${item.type}" onclick="openDetail('${item.id}')">
            <div class="result-header">
                <div class="result-info-left">
                    <div class="result-name">${item.name}</div>
                    <div class="result-description">
                        ${item.type === 'professional' ? item.oficio : item.specialties[0] || item.category}
                    </div>
                    <div class="result-badges">
                        <span class="badge ${item.type}">
                            ${item.type === 'professional' ? '👤 Profesional' : '🏢 Negocio'}
                        </span>
                        ${item.type === 'professional' && item.emergency24 ? '<span class="badge emergency">🚨 Emergencia 24hs</span>' : ''}
                        ${item.type === 'professional' && item.emergency ? '<span class="badge emergency">🔔 Emergencia</span>' : ''}
                    </div>
                </div>
                <div class="rating">
                    <span class="stars">★</span>
                    <span>${item.rating || 0}</span>
                </div>
            </div>
            <div class="result-details">
                <div>📞 ${item.phone}</div>
                <div>📍 ${item.address}</div>
            </div>
        </div>
    `).join('');
}

// Abrir modal de detalle
function openDetail(itemId) {
    const item = [...allProfessionals, ...allBusinesses].find(i => i.id === itemId);
    if (!item) return;
    
    const isProfessional = item.type === 'professional';
    
    const reviewsHtml = (item.reviews || []).length > 0 ? `
        <div class="modal-section">
            <div class="modal-label">⭐ Opiniones</div>
            <div class="reviews-container">
                ${item.reviews.map(review => `
                    <div class="review">
                        <div class="review-header">
                            <span>${review.name}</span>
                            <span class="stars">${'★'.repeat(review.rating)}</span>
                        </div>
                        <p class="review-text">"${review.text}"</p>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';
    
    const modalHtml = `
        <div class="modal-content">
            <button class="close-btn" onclick="closeDetail()">✕</button>
            <h2 class="modal-title">${item.name}</h2>
            <p class="modal-type">
                <span class="badge ${item.type}">
                    ${isProfessional ? '👤 ' + item.oficio : '🏢 Negocio'}
                </span>
            </p>
            
            <div class="modal-section">
                <div class="modal-label">⭐ Calificación</div>
                <div class="modal-content-text">
                    <span class="stars">★</span>
                    <span>${item.rating || 0}</span>
                    <span style="color: var(--text-muted);">(${item.reviews?.length || 0} reseñas)</span>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-label">📞 Teléfono</div>
                <div class="modal-content-text">${item.phone}</div>
            </div>

            <div class="modal-section">
                <div class="modal-label">📍 Ubicación</div>
                <div class="modal-content-text">${item.address}</div>
            </div>

            <div class="modal-section">
                <div class="modal-label">${isProfessional ? '🕐 Disponibilidad' : '🕐 Horarios'}</div>
                <div class="modal-content-text">${isProfessional ? item.availability : item.hours}</div>
            </div>

            ${item.type === 'professional' && (item.emergency || item.emergency24) ? `
                <div class="modal-section">
                    <div class="modal-label">🚨 Servicios de Emergencia</div>
                    <div class="modal-content-text">
                        ${item.emergency24 ? '✓ Disponible 24hs' : ''}
                        ${item.emergency ? '✓ Servicio de emergencia' : ''}
                    </div>
                </div>
            ` : ''}

            <div class="modal-section">
                <div class="modal-label">${isProfessional ? '🎯 Servicios' : '🎯 Especialidades'}</div>
                <div class="modal-services">
                    ${item.specialties.map(s => `<div class="service-tag">${s}</div>`).join('')}
                </div>
            </div>

            ${reviewsHtml}
        </div>
    `;
    
    detailModal.innerHTML = modalHtml;
    detailModal.classList.remove('hidden');
}

// Cerrar modal
function closeDetail() {
    detailModal.classList.add('hidden');
}

// Cargar datos de Firebase
async function loadData() {
    try {
        allProfessionals = await getItems('professional');
        allBusinesses = await getItems('business');
        
        // Calcular rating promedio
        allProfessionals.forEach(p => {
            p.rating = p.reviews ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1) : 0;
            p.type = 'professional';
        });
        
        allBusinesses.forEach(b => {
            b.rating = b.reviews ? (b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length).toFixed(1) : 0;
            b.type = 'business';
        });
        
        renderCategories();
        render();
    } catch (error) {
        console.error('Error loading data:', error);
        resultsContainer.innerHTML = '<div class="empty-state">Error al cargar datos. Por favor recarga la página.</div>';
    }
}

// Cerrar modal al hacer click fuera
detailModal.addEventListener('click', e => {
    if (e.target === detailModal) {
        closeDetail();
    }
});

// Inicializar
window.addEventListener('load', loadData);
