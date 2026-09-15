// Estado
let currentType = 'professional';
let allProfessionals = [];
let allBusinesses = [];

// Elementos del DOM
const typeButtons = document.querySelectorAll('.type-btn');
const addForm = document.getElementById('addForm');
const adminTabButtons = document.querySelectorAll('.admin-tab-btn');
const adminTabContents = document.querySelectorAll('.admin-tab-content');
const professionalFields = document.getElementById('professionalFields');
const businessFields = document.getElementById('businessFields');
const professionalsList = document.getElementById('professionalsList');
const businessesList = document.getElementById('businessesList');

// Event Listeners para tipo de registro
typeButtons.forEach(btn => {
    btn.addEventListener('click', e => {
        typeButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentType = e.target.dataset.type;
        updateFormFields();
    });
});

// Event Listeners para tabs
adminTabButtons.forEach(btn => {
    btn.addEventListener('click', e => {
        adminTabButtons.forEach(b => b.classList.remove('active'));
        adminTabContents.forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.tab + 'Tab').classList.add('active');
        
        if (e.target.dataset.tab === 'manage') {
            loadManagedItems();
        }
    });
});

// Actualizar campos del formulario según tipo
function updateFormFields() {
    if (currentType === 'professional') {
        professionalFields.style.display = 'block';
        businessFields.style.display = 'none';
        document.getElementById('oficio').required = true;
        document.getElementById('availability').required = true;
        document.getElementById('hours').required = false;
    } else {
        professionalFields.style.display = 'none';
        businessFields.style.display = 'block';
        document.getElementById('oficio').required = false;
        document.getElementById('availability').required = false;
        document.getElementById('hours').required = true;
    }
}

// Mostrar mensaje
function showMessage(text, type = 'success') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    const form = document.getElementById('addTab');
    form.insertBefore(message, form.firstChild);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}

// Validar y guardar formulario
addForm.addEventListener('submit', async e => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        category: document.getElementById('category').value,
        specialties: document.getElementById('specialties').value.split(',').map(s => s.trim()),
        rating: 5,
        reviews: []
    };
    
    if (currentType === 'professional') {
        Object.assign(formData, {
            type: 'professional',
            oficio: document.getElementById('oficio').value,
            availability: document.getElementById('availability').value,
            emergency24: document.getElementById('emergency24').checked,
            emergency: document.getElementById('emergency').checked
        });
    } else {
        Object.assign(formData, {
            type: 'business',
            hours: document.getElementById('hours').value
        });
    }
    
    try {
        await saveItem(currentType, formData);
        showMessage(`${currentType === 'professional' ? 'Profesional' : 'Negocio'} agregado exitosamente`, 'success');
        addForm.reset();
        
        // Resetear valores por defecto
        document.querySelector('[data-type="professional"]').classList.add('active');
        currentType = 'professional';
        updateFormFields();
    } catch (error) {
        showMessage('Error al guardar: ' + error.message, 'error');
    }
});

// Cargar y mostrar items para gestionar
async function loadManagedItems() {
    try {
        // Cargar profesionales
        allProfessionals = await getItems('professional');
        professionalsList.innerHTML = allProfessionals.length === 0 
            ? '<p>No hay profesionales registrados</p>'
            : allProfessionals.map(p => renderItemCard(p, 'professional')).join('');
        
        // Cargar negocios
        allBusinesses = await getItems('business');
        businessesList.innerHTML = allBusinesses.length === 0
            ? '<p>No hay negocios registrados</p>'
            : allBusinesses.map(b => renderItemCard(b, 'business')).join('');
        
        // Agregar event listeners para botones
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', e => {
                const id = e.target.dataset.id;
                const type = e.target.dataset.type;
                if (confirm('¿Estás seguro que quieres eliminar este registro?')) {
                    deleteItemFromDB(type, id);
                }
            });
        });
    } catch (error) {
        professionalsList.innerHTML = '<p>Error al cargar datos</p>';
        businessesList.innerHTML = '<p>Error al cargar datos</p>';
    }
}

// Renderizar tarjeta de item
function renderItemCard(item, type) {
    return `
        <div class="item-card">
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-meta">
                    ${type === 'professional' ? '👤 ' + item.oficio : '🏢 Negocio'} • ${item.category}
                </div>
                <div class="item-details">
                    <div>📞 ${item.phone}</div>
                    <div>📍 ${item.address}</div>
                    ${type === 'professional' ? `<div>🕐 ${item.availability}</div>` : `<div>🕐 ${item.hours}</div>`}
                    ${item.emergency24 ? '<div>🚨 Disponible 24hs</div>' : ''}
                    ${item.emergency ? '<div>🔔 Servicio de emergencia</div>' : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-delete" data-id="${item.id}" data-type="${type}">Eliminar</button>
            </div>
        </div>
    `;
}

// Eliminar item de la base de datos
async function deleteItemFromDB(type, id) {
    try {
        await deleteItem(type, id);
        showMessage(`${type === 'professional' ? 'Profesional' : 'Negocio'} eliminado`, 'success');
        loadManagedItems();
    } catch (error) {
        showMessage('Error al eliminar: ' + error.message, 'error');
    }
}

// Inicializar
window.addEventListener('load', updateFormFields);
