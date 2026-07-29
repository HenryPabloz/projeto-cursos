/**
 * auth.js — Sessão simulada (localStorage) e controle de acesso por role.
 * Usado por todas as telas que exigem login ou restringem áreas por role.
 */

const CHAVE_USUARIO_LOGADO = 'usuarioLogado';

// Lê o usuário salvo no localStorage (ou null se ninguém estiver logado)
function obterUsuarioLogado() {
    const usuarioSalvo = localStorage.getItem(CHAVE_USUARIO_LOGADO);

    if (!usuarioSalvo) {
        return null;
    }

    try {
        return JSON.parse(usuarioSalvo);
    } catch (erro) {
        return null;
    }
}

// Se não houver ninguém logado, manda para a tela de login
function exigirLogin() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
        window.location.href = './login.html';
        return null;
    }

    return usuario;
}

// Verifica se o usuário logado tem um dos roles permitidos.
// Se não tiver, mostra a área de "acesso negado" (precisa existir na página)
// e esconde o conteúdo protegido.
function exigirRole(rolesPermitidos, idConteudoProtegido, idAcessoNegado) {
    const usuario = exigirLogin();

    if (!usuario) {
        return null;
    }

    const temPermissao = rolesPermitidos.includes(usuario.role);

    const conteudoProtegido = document.querySelector(`#${idConteudoProtegido}`);
    const acessoNegado = document.querySelector(`#${idAcessoNegado}`);

    if (!temPermissao) {
        if (conteudoProtegido) conteudoProtegido.classList.add('oculto');
        if (acessoNegado) acessoNegado.classList.remove('oculto');

        if (typeof animacoes !== 'undefined') {
            animacoes.mostrarToast('erro', 'Acesso negado', 'Você não tem permissão para acessar esta página. Redirecionando...');
        }

        setTimeout(() => {
            window.location.href = './catalogo-cursos.html';
        }, 2500);

        return null;
    }

    if (conteudoProtegido) conteudoProtegido.classList.remove('oculto');
    if (acessoNegado) acessoNegado.classList.add('oculto');

    return usuario;
}

// Remove o usuário logado e volta para a tela de login
function fazerLogout() {
    localStorage.removeItem(CHAVE_USUARIO_LOGADO);
    window.location.href = './login.html';
}

// Preenche o avatar/nome/badge do usuário na navbar e mostra só os links
// que o role dele pode acessar (usa o atributo data-restrito-a="editor,admin")
function preencherNavbar(usuario) {
    const iniciais = usuario.nome
        .split(' ')
        .slice(0, 2)
        .map((parte) => parte.charAt(0).toUpperCase())
        .join('');

    document.querySelectorAll('.navbar-user-avatar').forEach((elemento) => {
        elemento.textContent = iniciais;
    });

    document.querySelectorAll('.navbar-user-nome').forEach((elemento) => {
        elemento.textContent = usuario.nome;
    });

    document.querySelectorAll('.navbar-badge-role').forEach((elemento) => {
        elemento.textContent = usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1);
        elemento.classList.remove('badge-role-aluno', 'badge-role-editor', 'badge-role-admin');
        elemento.classList.add(`badge-role-${usuario.role}`);
    });

    document.querySelectorAll('[data-restrito-a]').forEach((elemento) => {
        const rolesPermitidos = elemento.getAttribute('data-restrito-a').split(',');

        if (!rolesPermitidos.includes(usuario.role)) {
            elemento.classList.add('oculto');
        }
    });

    document.querySelectorAll('#btnLogout, .js-logout').forEach((botao) => {
        botao.addEventListener('click', fazerLogout);
    });
}

// Liga/desliga o menu de navegação (hamburguer) em telas de tablet/celular
function configurarMenuMobile() {
    const botaoHamburguer = document.querySelector('.navbar-hamburguer');
    const menuNavbar = document.querySelector('.navbar-menu');

    if (!botaoHamburguer || !menuNavbar) return;

    botaoHamburguer.addEventListener('click', () => {
        const estaAberto = menuNavbar.classList.toggle('aberto');
        botaoHamburguer.setAttribute('aria-expanded', String(estaAberto));
    });

    // Clicar num link do menu ou fora dele fecha o menu
    menuNavbar.addEventListener('click', (event) => {
        if (event.target.closest('.navbar-menu-item')) {
            menuNavbar.classList.remove('aberto');
            botaoHamburguer.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('click', (event) => {
        const cliqueForaDoMenu = !menuNavbar.contains(event.target) && !botaoHamburguer.contains(event.target);
        if (cliqueForaDoMenu) {
            menuNavbar.classList.remove('aberto');
            botaoHamburguer.setAttribute('aria-expanded', 'false');
        }
    });
}

// Liga/desliga o dropdown do usuário na navbar
function configurarDropdownNavbar() {
    const menuUsuario = document.querySelector('#menuUsuario');
    const dropdown = document.querySelector('#dropdownUsuario');

    if (!menuUsuario || !dropdown) {
        return;
    }

    menuUsuario.addEventListener('click', () => {
        dropdown.classList.toggle('oculto');
    });

    document.addEventListener('click', (event) => {
        if (!menuUsuario.contains(event.target)) {
            dropdown.classList.add('oculto');
        }
    });
}
