# InstaScheduler Pro — Deploy no Netlify

## 📁 Estrutura
```
instascheduler-netlify/
├── public/
│   └── index.html          ← Frontend completo
├── netlify/
│   └── functions/
│       ├── ig-auth-start.js    ← Inicia OAuth do Instagram
│       └── ig-auth-callback.js ← Recebe o código e salva o token
└── netlify.toml            ← Configuração do Netlify
```

## 🚀 Deploy em 3 passos

### 1. Acesse netlify.com e faça login

### 2. Arraste a pasta `instascheduler-netlify` para o Netlify
- Vá em https://app.netlify.com
- Clique em **"Add new site" → "Deploy manually"**
- Arraste a **pasta inteira** `instascheduler-netlify`

### 3. Configure as variáveis de ambiente
No painel do Netlify → **Site Settings → Environment Variables**, adicione:

| Variável         | Valor                          |
|------------------|-------------------------------|
| `META_APP_ID`    | `1707170137303501`             |
| `META_APP_SECRET` | `sua-chave-secreta-aqui` |

### 4. Configure o Redirect URI no Meta
- Acesse https://developers.facebook.com → seu App
- Vá em **Instagram → Basic Display → Valid OAuth Redirect URIs**
- Adicione: `https://SEU-SITE.netlify.app/api/ig-auth-callback`

---

## 🔗 Como funciona o login do Instagram

1. No painel, abra um cliente → **Conectar Instagram**
2. Uma janela abre com o login oficial do Instagram
3. O cliente faz login com usuário e senha
4. O sistema recebe o token automaticamente
5. A conta aparece conectada — igual ao mLabs ✅

## 🔑 Permissões necessárias no App Meta
- `instagram_business_basic`
- `instagram_business_content_publish`
