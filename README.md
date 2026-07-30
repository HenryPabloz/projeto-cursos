# 🕹️ Game Academy

Plataforma de cursos online com tema de games — a "Game Academy": 30 cursos sobre desenvolvimento de jogos (programação, game design, arte, IA, redes, otimização e mais), cada um identificado visualmente por um Pokémon que representa seu nível de dificuldade.

Projeto acadêmico/de estudo, construído em HTML, CSS e JavaScript puros (sem frameworks nem build), com um back-end simulado via `json-server`.

---

## 📚 Sobre a plataforma

- **Catálogo de cursos** com busca, filtro por categoria e por nível (Iniciante 🟢 / Mediano 🟡 / Avançado 🔴), ordenação e paginação.
- **Detalhes do curso**: aulas, progresso do aluno, avaliações por estrelas, matrícula.
- **Autenticação simulada** com 3 perfis de acesso (aluno, editor, admin) e cadastro de novos alunos (com email de boas-vindas via EmailJS).
- **Painel do Editor**: CRUD de categorias, cursos e aulas.
- **Painel Admin**: gestão de usuários, com ativação/desativação de conta (soft delete — nenhum usuário é excluído de verdade, só desativado).
- **Meu Perfil**: dados da conta, troca de senha e lista dos cursos em que o aluno está matriculado.

---

## 🛠️ Tecnologias

- **HTML5 / CSS3 / JavaScript (vanilla)** — sem frameworks, sem bundler.
- **[json-server](https://github.com/typicode/json-server)** — simula uma API REST em cima do arquivo `src/JSONs/dbCursos.json`.
- **[GSAP](https://gsap.com/) + [Lenis](https://lenis.darkroom.engineering/)** — animações e scroll suave.
- **[Lucide Icons](https://lucide.dev/)** — ícones (ex: mostrar/ocultar senha).
- **[EmailJS](https://www.emailjs.com/)** — envio do email de boas-vindas ao criar conta.

---

## 📂 Estrutura de pastas

```
src/
├── HTML/      → uma página por tela (login, catálogo, detalhes, perfil, painel do editor, painel admin)
├── CSS/
│   ├── base/          → reset, variáveis (design tokens) e tipografia
│   ├── componentes/    → navbar, sidebar, botões, cards, modais, formulários, tabelas, badges, toasts, paginação...
│   ├── paginas/        → estilos específicos de cada tela
│   └── utilitarios/    → layout, espaçamento, responsividade, animações, acessibilidade
├── JS/        → um arquivo por tela + módulos compartilhados (api.js, auth.js, utils.js, animacoes.js)
├── JSONs/     → dbCursos.json (o "banco de dados" servido pelo json-server)
└── IMG/       → sprites, ícones e imagens usadas no projeto
```

---

## ▶️ Como rodar o projeto

O projeto não tem build — só precisa de duas coisas rodando ao mesmo tempo:

**1. O back-end simulado (json-server), na porta 3000:**
```bash
npx json-server --watch src/JSONs/dbCursos.json --port 3000
```

**2. O front-end estático**, servido por qualquer servidor local (ex: a extensão **Live Server** do VS Code, clicando com o botão direito em `src/HTML/login.html` → "Open with Live Server").

Depois é só abrir `src/HTML/login.html` no navegador.

### Email de boas-vindas (opcional)

O envio de email ao criar uma conta usa o EmailJS. Para funcionar, copie `src/JS/emailjs.config.example.js` para `src/JS/emailjs.config.js` (esse arquivo é ignorado pelo Git) e preencha com as chaves da sua conta em [emailjs.com](https://www.emailjs.com/):

```js
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'sua_public_key_aqui',
    SERVICE_ID: 'seu_service_id_aqui',
    TEMPLATE_ID: 'seu_template_id_aqui',
};
```

Sem esse arquivo, o cadastro continua funcionando normalmente — só o email de boas-vindas não é enviado.

---

## 👤 Contas de teste

Todas usam a senha `senha123`.

| Perfil | Email |
|---|---|
| Aluno | `camila.rocha@email.com` |
| Editor | `rafael.mendes@email.com` |
| Admin | `juliana.costa@email.com` |

Também é possível criar uma conta nova pela tela de login (sempre entra como aluno, já ativa).

---

## 🔐 Perfis de acesso

- **Aluno**: navega pelo catálogo, se matricula, acompanha o progresso das aulas e avalia cursos concluídos.
- **Editor**: tudo que o aluno pode, mais o Painel do Editor (categorias, cursos e aulas).
- **Admin**: tudo que o editor pode, mais o Painel Admin (gestão de usuários).
