# 🍭 Sistema de Doces da Escola - Instruções de Configuração

## 📋 Visão Geral

Este sistema permite gerenciar a venda de doces na escola com:
- Interface de administração para cadastrar doces
- Página do cliente para visualizar e fazer pedidos
- Integração com WhatsApp para receber pedidos
- Upload de imagens no Firebase Storage

## 🔧 Configuração do Firebase

### Passo 1: Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Criar um projeto"
3. Digite um nome para seu projeto (ex: "doces-escola")
4. Siga os passos de configuração

### Passo 2: Configurar Firestore Database

1. No painel do Firebase, vá em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de teste" (para desenvolvimento)
4. Selecione uma localização próxima (ex: southamerica-east1)

### Passo 3: Configurar Storage

1. No painel do Firebase, vá em "Storage"
2. Clique em "Começar"
3. Aceite as regras padrão

### Passo 4: Configurar Hosting

1. No painel do Firebase, vá em "Hosting"
2. Clique em "Começar"
3. Instale o Firebase CLI no seu computador:
   ```bash
   npm install -g firebase-tools
   ```

### Passo 5: Obter Configurações do Projeto

1. No painel do Firebase, vá em "Configurações do projeto" (ícone de engrenagem)
2. Role para baixo até "Seus aplicativos"
3. Clique em "Adicionar app" e escolha "Web"
4. Digite um nome para o app (ex: "doces-web")
5. Copie as configurações que aparecem

### Passo 6: Atualizar Arquivos de Configuração

Substitua as configurações nos seguintes arquivos:

**Em `public/admin-script.js` e `public/script.js`:**
```javascript
const firebaseConfig = {
    apiKey: "sua-api-key-aqui",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

**Em `public/script.js`, atualize o número do WhatsApp:**
```javascript
const WHATSAPP_NUMBER = '5511999999999'; // Seu número com código do país e DDD
```

## 🚀 Deploy do Sistema

### Opção 1: Firebase Hosting (Recomendado)

1. No terminal, navegue até a pasta do projeto:
   ```bash
   cd sweets_app
   ```

2. Faça login no Firebase:
   ```bash
   firebase login
   ```

3. Inicialize o projeto:
   ```bash
   firebase init
   ```
   - Selecione "Hosting", "Firestore" e "Storage"
   - Escolha o projeto criado
   - Use "public" como diretório público
   - Configure como SPA (Single Page Application): Não
   - Não sobrescreva arquivos existentes

4. Faça o deploy:
   ```bash
   firebase deploy
   ```

### Opção 2: Outros Serviços de Hosting

Você pode hospedar os arquivos da pasta `public` em qualquer serviço de hosting estático como:
- Netlify
- Vercel
- GitHub Pages
- Surge.sh

## 📱 Como Usar o Sistema

### Para o Administrador:

1. Acesse `seu-site.com/admin.html`
2. Digite a senha: `112`
3. Use a aba "Adicionar Doce" para cadastrar novos produtos
4. Use a aba "Lista de Doces" para gerenciar produtos existentes

### Para os Clientes:

1. Acessem `seu-site.com`
2. Naveguem pelos doces disponíveis
3. Adicionem itens ao carrinho
4. Escolham a opção de retirada
5. Cliquem em "Fazer Pedido" para enviar via WhatsApp

## 🔒 Segurança

### Para Produção, Configure:

1. **Regras do Firestore** mais restritivas em `firestore.rules`
2. **Regras do Storage** mais restritivas em `storage.rules`
3. **Autenticação** adequada para o painel admin
4. **HTTPS** obrigatório

### Exemplo de Regras Mais Seguras:

**firestore.rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /doces/{docId} {
      allow read: if true;
      allow write: if request.auth != null; // Apenas usuários autenticados
    }
  }
}
```

## 🛠️ Personalização

### Alterar Senha do Admin:
No arquivo `public/admin-script.js`, linha 31:
```javascript
const ADMIN_PASSWORD = 'sua-nova-senha';
```

### Alterar Cores e Estilo:
Edite o arquivo `public/style.css` e `public/admin-style.css`

### Alterar Textos:
Edite os arquivos HTML (`index.html` e `admin.html`)

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12) para erros
2. Confirme se as configurações do Firebase estão corretas
3. Teste a conexão com a internet
4. Verifique se o projeto Firebase está ativo

## 🎯 Funcionalidades Implementadas

✅ Interface de administração com autenticação
✅ Cadastro de doces com upload de imagens
✅ Página do cliente responsiva
✅ Sistema de carrinho de compras
✅ Integração com WhatsApp
✅ Filtros por tipo de retirada
✅ Design kawaii retrô
✅ Armazenamento em tempo real
✅ Notificações visuais

---

**Desenvolvido com ❤️ para facilitar a venda de doces na escola!**

