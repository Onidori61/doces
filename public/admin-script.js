// Importar Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
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
let currentEditId = null;
let doces = [];

// Elementos DOM
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const doceForm = document.getElementById('doceForm');
const docesList = document.getElementById('docesList');
const totalDoces = document.getElementById('totalDoces');
const loadingOverlay = document.getElementById('loadingOverlay');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOk = document.getElementById('confirmOk');
const confirmCancel = document.getElementById('confirmCancel');

// Elementos do formulário
const nomeDoce = document.getElementById('nomeDoce');
const precoDoce = document.getElementById('precoDoce');
const descricaoDoce = document.getElementById('descricaoDoce');
const imagemUrl = document.getElementById('imagemUrl');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImage = document.getElementById('removeImage');
const trocaAula = document.getElementById('trocaAula');
const intervalo = document.getElementById('intervalo');
const esgotado = document.getElementById('esgotado');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Senha de acesso
const ADMIN_PASSWORD = '112';

// Verificar se já está logado
if (localStorage.getItem('adminLoggedIn') === 'true') {
    showAdminPanel();
} else {
    showLoginScreen();
}

// Event Listeners
loginBtn.addEventListener('click', handleLogin);
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

logoutBtn.addEventListener('click', handleLogout);

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

doceForm.addEventListener('submit', handleSaveDoce);
cancelBtn.addEventListener('click', handleCancelEdit);

imagemUrl.addEventListener('input', handleImageUrlChange);
removeImage.addEventListener('click', handleRemoveImage);

confirmCancel.addEventListener('click', hideConfirmModal);

// Funções de Autenticação
function handleLogin() {
    const password = passwordInput.value.trim();
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
        loginError.textContent = '';
    } else {
        loginError.textContent = 'Senha incorreta! Tente novamente.';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    showLoginScreen();
}

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    passwordInput.focus();
}

function showAdminPanel() {
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    loadDoces();
}

// Funções de Navegação
function switchTab(tabName) {
    // Atualizar botões
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Atualizar conteúdo
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName + 'Tab');
    });
    
    // Limpar formulário ao trocar para aba de adicionar
    if (tabName === 'add') {
        resetForm();
    }
}

// Funções do Formulário
function handleImageUrlChange(e) {
    const url = e.target.value.trim();
    if (url) {
        // Validar se é uma URL válida
        try {
            new URL(url);
            previewImg.src = url;
            previewImg.onload = () => {
                imagePreview.classList.remove('hidden');
                document.querySelector('.upload-placeholder').style.display = 'none';
            };
            previewImg.onerror = () => {
                showNotification('URL da imagem inválida ou inacessível', 'error');
                handleRemoveImage();
            };
        } catch (error) {
            showNotification('URL inválida', 'error');
            handleRemoveImage();
        }
    } else {
        handleRemoveImage();
    }
}

function handleRemoveImage() {
    imagemUrl.value = '';
    imagePreview.classList.add('hidden');
    document.querySelector('.upload-placeholder').style.display = 'block';
    previewImg.src = '';
}

async function handleSaveDoce(e) {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!nomeDoce.value.trim()) {
        alert('Nome do doce é obrigatório!');
        return;
    }
    
    if (!precoDoce.value || parseFloat(precoDoce.value) <= 0) {
        alert('Preço deve ser maior que zero!');
        return;
    }
    
    if (!trocaAula.checked && !intervalo.checked) {
        alert('Selecione pelo menos uma opção de retirada!');
        return;
    }
    
    showLoading(true);
    
    try {
        // Preparar dados do doce
        const doceData = {
            nome: nomeDoce.value.trim(),
            preco: parseFloat(precoDoce.value),
            descricao: descricaoDoce.value.trim(),
            imageUrl: imagemUrl.value.trim() || '',
            opcoes: [],
            esgotado: esgotado.checked,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        if (trocaAula.checked) doceData.opcoes.push('troca');
        if (intervalo.checked) doceData.opcoes.push('intervalo');
        
        if (currentEditId) {
            // Atualizar doce existente
            await updateDoc(doc(db, 'doces', currentEditId), doceData);
            showNotification('Doce atualizado com sucesso!', 'success');
        } else {
            // Adicionar novo doce
            await addDoc(collection(db, 'doces'), doceData);
            showNotification('Doce adicionado com sucesso!', 'success');
        }
        
        resetForm();
        switchTab('list');
        
    } catch (error) {
        console.error('Erro ao salvar doce:', error);
        showNotification('Erro ao salvar doce. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
}

function handleCancelEdit() {
    resetForm();
    switchTab('list');
}

function resetForm() {
    doceForm.reset();
    handleRemoveImage();
    currentEditId = null;
    saveBtn.querySelector('.btn-text').textContent = 'Salvar Doce ✦';
}

// Funções de Doces
async function loadDoces() {
    showLoading(true);
    
    try {
        const querySnapshot = await getDocs(collection(db, 'doces'));
        doces = [];
        
        querySnapshot.forEach((doc) => {
            doces.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderDoces();
        updateStats();
        
    } catch (error) {
        console.error('Erro ao carregar doces:', error);
        showNotification('Erro ao carregar doces.', 'error');
    } finally {
        showLoading(false);
    }
}

function renderDoces() {
    if (doces.length === 0) {
        docesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #8e44ad;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🍭</div>
                <h3>Nenhum doce cadastrado ainda</h3>
                <p>Que tal adicionar o primeiro docinho?</p>
            </div>
        `;
        return;
    }
    
    docesList.innerHTML = doces.map(doce => `
        <div class="doce-card ${doce.esgotado ? 'esgotado' : ''}">
            ${doce.imageUrl ? `<img src="${doce.imageUrl}" alt="${doce.nome}" class="doce-image" onerror="this.style.display='none'">` : ''}
            <div class="doce-info">
                <h4>${doce.nome} ${doce.esgotado ? '<span class="status-esgotado">ESGOTADO</span>' : ''}</h4>
                <div class="doce-price">R$ ${doce.preco.toFixed(2)}</div>
                ${doce.descricao ? `<div class="doce-description">${doce.descricao}</div>` : ''}
                <div class="doce-options">
                    ${doce.opcoes && doce.opcoes.includes('troca') ? '<span class="option-tag">🔄 Troca de Aula</span>' : ''}
                    ${doce.opcoes && doce.opcoes.includes('intervalo') ? '<span class="option-tag">⏰ Intervalo</span>' : ''}
                </div>
                <div class="doce-actions">
                    <button class="btn-edit" onclick="editDoce('${doce.id}')">✏️ Editar</button>
                    <button class="btn-delete" onclick="deleteDoce('${doce.id}')">🗑️ Excluir</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    totalDoces.textContent = doces.length;
}

// Funções globais para os botões
window.editDoce = function(id) {
    const doce = doces.find(d => d.id === id);
    if (!doce) return;
    
    currentEditId = id;
    
    // Preencher formulário
    nomeDoce.value = doce.nome;
    precoDoce.value = doce.preco;
    descricaoDoce.value = doce.descricao || '';
    imagemUrl.value = doce.imageUrl || '';
    trocaAula.checked = doce.opcoes && doce.opcoes.includes('troca');
    intervalo.checked = doce.opcoes && doce.opcoes.includes('intervalo');
    esgotado.checked = doce.esgotado || false;
    
    // Mostrar imagem se houver
    if (doce.imageUrl) {
        previewImg.src = doce.imageUrl;
        imagePreview.classList.remove('hidden');
        document.querySelector('.upload-placeholder').style.display = 'none';
    }
    
    saveBtn.querySelector('.btn-text').textContent = 'Atualizar Doce ✦';
    switchTab('add');
};

window.deleteDoce = function(id) {
    const doce = doces.find(d => d.id === id);
    if (!doce) return;
    
    confirmMessage.textContent = `Tem certeza que deseja excluir "${doce.nome}"?`;
    confirmModal.classList.remove('hidden');
    
    confirmOk.onclick = async () => {
        hideConfirmModal();
        showLoading(true);
        
        try {
            await deleteDoc(doc(db, 'doces', id));
            showNotification('Doce excluído com sucesso!', 'success');
            loadDoces();
            
        } catch (error) {
            console.error('Erro ao excluir doce:', error);
            showNotification('Erro ao excluir doce.', 'error');
        } finally {
            showLoading(false);
        }
    };
};

// Funções Utilitárias
function showLoading(show) {
    loadingOverlay.classList.toggle('hidden', !show);
}

function hideConfirmModal() {
    confirmModal.classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos da notificação
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '600',
        zIndex: '1002',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px'
    });
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
    } else {
        notification.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
    }
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Configurar listener em tempo real para doces
onSnapshot(collection(db, 'doces'), (snapshot) => {
    if (adminPanel.classList.contains('hidden')) return;
    
    doces = [];
    snapshot.forEach((doc) => {
        doces.push({
            id: doc.id,
            ...doc.data()
        });
    });
    
    renderDoces();
    updateStats();
});

console.log('Admin panel carregado com sucesso!');

