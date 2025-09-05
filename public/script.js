// Importar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    onSnapshot 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Sua configuração do Firebase para o aplicativo web
const firebaseConfig = {
  apiKey: "AIzaSyBal20gWy_05t2d5Bsw1s8I8a3T7aOtwkI",
  authDomain: "doces-e393e.firebaseapp.com",
  projectId: "doces-e393e", // <<< ESTE DEVE SER O CORRETO!
  storageBucket: "doces-e393e.firebasestorage.app",
  messagingSenderId: "167548871841",
  appId: "1:167548871841:web:b45a5be4439993adcc7ce0"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variáveis globais
let doces = [];
let cart = [];
let currentFilter = 'all';

// Número do WhatsApp (substitua pelo seu número)
const WHATSAPP_NUMBER = '5511999999999'; // Formato: 55 + DDD + número

// Elementos DOM
const loadingDoces = document.getElementById('loadingDoces');
const docesContainer = document.getElementById('docesContainer');
const emptyState = document.getElementById('emptyState');
const cartButton = document.getElementById('cartButton');
const cartCount = document.getElementById('cartCount');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const emptyCart = document.getElementById('emptyCart');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const deliveryTroca = document.getElementById('deliveryTroca');
const deliveryIntervalo = document.getElementById('deliveryIntervalo');
const confirmModal = document.getElementById('confirmModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm = document.getElementById('modalConfirm');
const orderSummary = document.getElementById('orderSummary');
const filterBtns = document.querySelectorAll('.filter-btn');

// Event Listeners
cartButton.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartSidebar);
cartOverlay.addEventListener('click', closeCartSidebar);
checkoutBtn.addEventListener('click', showCheckoutModal);
modalCancel.addEventListener('click', hideCheckoutModal);
modalOverlay.addEventListener('click', hideCheckoutModal);
modalConfirm.addEventListener('click', processOrder);

// Filtros
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        updateFilterButtons();
        renderDoces();
    });
});

// Opções de entrega
deliveryTroca.addEventListener('change', updateCheckoutButton);
deliveryIntervalo.addEventListener('change', updateCheckoutButton);

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    loadDoces();
    loadCartFromStorage();
    updateCartDisplay();
});

// Funções de Carregamento
async function loadDoces() {
    showLoading(true);
    
    try {
        // Configurar listener em tempo real
        onSnapshot(collection(db, 'doces'), (snapshot) => {
            doces = [];
            snapshot.forEach((doc) => {
                doces.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderDoces();
            showLoading(false);
        });
        
    } catch (error) {
        console.error('Erro ao carregar doces:', error);
        showNotification('Erro ao carregar doces. Verifique sua conexão.', 'error');
        showLoading(false);
        showEmptyState();
    }
}

function renderDoces() {
    // Filtrar doces
    let filteredDoces = doces.filter(doce => !doce.esgotado); // Não mostrar doces esgotados
    
    if (currentFilter !== 'all') {
        filteredDoces = filteredDoces.filter(doce => 
            doce.opcoes && doce.opcoes.includes(currentFilter)
        );
    }
    
    if (filteredDoces.length === 0) {
        showEmptyState();
        return;
    }
    
    hideEmptyState();
    
    docesContainer.innerHTML = filteredDoces.map(doce => `
        <div class="doce-card" data-id="${doce.id}">
            ${doce.imageUrl ? `
                <img src="${doce.imageUrl}" alt="${doce.nome}" class="doce-image" 
                     onerror="this.style.display='none'">
            ` : `
                <div class="doce-no-image">
                    <span>🍭</span>
                    <p>Sem foto</p>
                </div>
            `}
            <div class="doce-info">
                <h3>${doce.nome}</h3>
                <div class="doce-price">R$ ${doce.preco.toFixed(2)}</div>
                ${doce.descricao ? `<div class="doce-description">${doce.descricao}</div>` : ''}
                <div class="doce-options">
                    ${doce.opcoes && doce.opcoes.includes('troca') ? 
                        '<span class="option-tag">🔄 Troca de Aula</span>' : ''}
                    ${doce.opcoes && doce.opcoes.includes('intervalo') ? 
                        '<span class="option-tag">⏰ Intervalo</span>' : ''}
                </div>
                <button class="add-to-cart-btn" onclick="addToCart('${doce.id}')">
                    Adicionar ao Carrinho 🛒
                </button>
            </div>
        </div>
    `).join('');
}

function showLoading(show) {
    loadingDoces.style.display = show ? 'flex' : 'none';
    docesContainer.style.display = show ? 'none' : 'grid';
}

function showEmptyState() {
    emptyState.classList.remove('hidden');
    docesContainer.style.display = 'none';
}

function hideEmptyState() {
    emptyState.classList.add('hidden');
    docesContainer.style.display = 'grid';
}

// Funções de Filtro
function updateFilterButtons() {
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === currentFilter);
    });
}

// Funções do Carrinho
window.addToCart = function(doceId) {
    const doce = doces.find(d => d.id === doceId);
    if (!doce || doce.esgotado) return;
    
    const existingItem = cart.find(item => item.id === doceId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: doceId,
            nome: doce.nome,
            preco: doce.preco,
            imageUrl: doce.imageUrl,
            opcoes: doce.opcoes,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    saveCartToStorage();
    showNotification(`${doce.nome} adicionado ao carrinho!`, 'success');
    
    // Animação do botão
    const btn = event.target;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        btn.style.transform = 'scale(1)';
    }, 150);
};

function removeFromCart(doceId) {
    const itemIndex = cart.findIndex(item => item.id === doceId);
    if (itemIndex > -1) {
        const item = cart[itemIndex];
        showNotification(`${item.nome} removido do carrinho!`, 'info');
        cart.splice(itemIndex, 1);
        updateCartDisplay();
        saveCartToStorage();
    }
}

function updateQuantity(doceId, change) {
    const item = cart.find(item => item.id === doceId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(doceId);
    } else {
        updateCartDisplay();
        saveCartToStorage();
    }
}

function updateCartDisplay() {
    // Atualizar contador
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    
    // Atualizar total
    const total = cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
    
    // Renderizar itens
    if (cart.length === 0) {
        cartItems.style.display = 'none';
        emptyCart.style.display = 'block';
    } else {
        cartItems.style.display = 'flex';
        emptyCart.style.display = 'none';
        
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                ${item.imageUrl ? `
                    <img src="${item.imageUrl}" alt="${item.nome}" class="cart-item-image"
                         onerror="this.style.display='none'">
                ` : `
                    <div class="cart-item-no-image">🍭</div>
                `}
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nome}</div>
                    <div class="cart-item-price">R$ ${item.preco.toFixed(2)}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart('${item.id}')" title="Remover item">
                    🗑️
                </button>
            </div>
        `).join('');
    }
    
    updateCheckoutButton();
}

function updateCheckoutButton() {
    const hasItems = cart.length > 0;
    const hasDeliveryOption = deliveryTroca.checked || deliveryIntervalo.checked;
    
    checkoutBtn.disabled = !hasItems || !hasDeliveryOption;
}

// Funções do Carrinho Lateral
function openCart() {
    cartSidebar.classList.add('open');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
    cartSidebar.classList.remove('open');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Funções de Checkout
function showCheckoutModal() {
    if (cart.length === 0) return;
    
    // Gerar resumo do pedido
    const deliveryOption = deliveryTroca.checked ? 'Troca de Aula (2°A)' : 'Intervalo (Recreio)';
    const total = cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
    
    orderSummary.innerHTML = `
        <div class="summary-section">
            <h4 style="color: #8e44ad; margin-bottom: 15px;">📋 Itens do Pedido:</h4>
            ${cart.map(item => `
                <div class="summary-item">
                    <span>${item.quantity}x ${item.nome}</span>
                    <span>R$ ${(item.preco * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="summary-item">
                <span><strong>Total:</strong></span>
                <span><strong>R$ ${total.toFixed(2)}</strong></span>
            </div>
        </div>
        <div class="summary-section" style="margin-top: 20px;">
            <h4 style="color: #8e44ad; margin-bottom: 10px;">📍 Retirada:</h4>
            <p style="background: rgba(255, 182, 193, 0.2); padding: 10px; border-radius: 10px; margin: 0;">
                ${deliveryOption}
            </p>
        </div>
    `;
    
    confirmModal.classList.remove('hidden');
    modalOverlay.classList.add('active');
    confirmModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideCheckoutModal() {
    confirmModal.classList.add('hidden');
    modalOverlay.classList.remove('active');
    confirmModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function processOrder() {
    if (cart.length === 0) return;
    
    // Preparar mensagem do WhatsApp
    const deliveryOption = deliveryTroca.checked ? 'Troca de Aula (2°A)' : 'Intervalo (Recreio)';
    const total = cart.reduce((sum, item) => sum + (item.preco * item.quantity), 0);
    
    let message = `*🍭 PEDIDO DE DOCES 🍭*\n\n`;
    message += `*📋 Itens:*\n`;
    
    cart.forEach(item => {
        message += `• ${item.quantity}x ${item.nome} - R$ ${(item.preco * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*💰 Total: R$ ${total.toFixed(2)}*\n\n`;
    message += `*📍 Retirada:* ${deliveryOption}\n\n`;
    message += `_Pedido feito através do site dos Doces da Escola_ ✦`;
    
    // Codificar mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Gerar link do WhatsApp
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Limpar carrinho após envio
    cart = [];
    updateCartDisplay();
    saveCartToStorage();
    
    // Fechar modais
    hideCheckoutModal();
    closeCartSidebar();
    
    showNotification('Pedido enviado! Você será redirecionado para o WhatsApp.', 'success');
}

// Funções de Armazenamento
function saveCartToStorage() {
    localStorage.setItem('sweetCart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('sweetCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            cart = [];
        }
    }
}

// Funções Utilitárias
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const notifications = document.getElementById('notifications');
    notifications.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notifications.contains(notification)) {
                notifications.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Tornar funções globais para uso nos event handlers inline
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;

// Fechar carrinho com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (cartSidebar.classList.contains('open')) {
            closeCartSidebar();
        }
        if (!confirmModal.classList.contains('hidden')) {
            hideCheckoutModal();
        }
    }
});

// Prevenir scroll do body quando carrinho estiver aberto
cartSidebar.addEventListener('scroll', (e) => {
    e.stopPropagation();
});

console.log('Sistema de doces carregado com sucesso!');

