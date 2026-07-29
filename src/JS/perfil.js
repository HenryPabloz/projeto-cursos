/**
 * perfil.js — Tela Meu Perfil.
 * Mostra os dados do usuário logado e permite editar nome/senha.
 */

document.addEventListener('DOMContentLoaded', async () => {

    const usuarioLogado = exigirLogin();
    if (!usuarioLogado) return;

    preencherNavbar(usuarioLogado);
    configurarDropdownNavbar();
    configurarMenuMobile();

    // Busca o registro completo (com o campo "senha", que não fica no localStorage)
    const usuarioCompleto = await ApiUsuarios.buscarPorId(usuarioLogado.id);

    if (!usuarioCompleto) {
        animacoes.mostrarToast('erro', 'Erro ao carregar', 'Não foi possível carregar os dados do seu perfil.');
        return;
    }

    function iniciaisDoNome(nome) {
        return nome.split(' ').slice(0, 2).map((parte) => parte.charAt(0).toUpperCase()).join('');
    }

    function renderizarInformacoes(usuario) {
        const rolePrimeiraLetraMaiuscula = usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1);

        document.querySelector('#perfilAvatar').textContent = iniciaisDoNome(usuario.nome);
        document.querySelector('#perfilNome').textContent = usuario.nome;

        const badgeRole = document.querySelector('#perfilBadgeRole');
        badgeRole.textContent = rolePrimeiraLetraMaiuscula;
        badgeRole.className = `badge badge-role-${usuario.role}`;

        document.querySelector('#perfilEmail').textContent = usuario.email;

        const roleTexto = document.querySelector('#perfilRoleTexto');
        roleTexto.innerHTML = `<span class="badge badge-role-${usuario.role}">${rolePrimeiraLetraMaiuscula}</span>`;

        const statusConta = document.querySelector('#perfilStatusConta');
        if (usuario.ativo) {
            statusConta.innerHTML = `<span class="badge badge-publicado"><span class="badge-ponto"></span>Ativa</span>`;
        } else {
            statusConta.innerHTML = `<span class="badge badge-rascunho"><span class="badge-ponto"></span>Inativa</span>`;
        }

        document.querySelector('#nomePerfil').value = usuario.nome;
    }

    renderizarInformacoes(usuarioCompleto);
    animacoes.animarEntradaPagina();

    // ===================================================================
    // MEUS CURSOS — cursos em que o aluno logado está matriculado
    // ===================================================================
    async function renderizarMeusCursos() {
        const listaMeusCursos = document.querySelector('#listaMeusCursos');
        const perfilSemCursos = document.querySelector('#perfilSemCursos');

        const [todasAsMatriculas, todosOsCursos] = await Promise.all([
            ApiMatriculas.listar(),
            ApiCursos.listar(),
        ]);

        if (!todasAsMatriculas || !todosOsCursos) {
            listaMeusCursos.innerHTML = '';
            perfilSemCursos.textContent = 'Não foi possível carregar seus cursos.';
            perfilSemCursos.classList.remove('oculto');
            return;
        }

        const matriculasDoAluno = todasAsMatriculas.filter((matricula) => matricula.usuarioId === usuarioCompleto.id);

        if (matriculasDoAluno.length === 0) {
            listaMeusCursos.innerHTML = '';
            perfilSemCursos.classList.remove('oculto');
            return;
        }

        perfilSemCursos.classList.add('oculto');

        listaMeusCursos.innerHTML = matriculasDoAluno.map((matricula) => {
            const curso = todosOsCursos.find((item) => item.id === matricula.cursoId);
            if (!curso) return '';

            const rotuloStatus = matricula.status === 'concluído' ? 'Concluído' : 'Em andamento';

            let selosPokemon = '';
            if (curso.pokemon) {
                selosPokemon = `
                    <img src="${curso.pokemon.spriteUrl}" alt="${curso.pokemon.nome}" class="perfil-curso-sprite" title="${curso.pokemon.nome}">
                `;
            }

            let selosNivel = '';
            if (curso.nivel) {
                selosNivel = `<span class="perfil-curso-nivel" style="background-color: ${curso.corNivel};">${curso.nivel}</span>`;
            }

            return `
                <div class="perfil-curso-item">
                    ${selosPokemon}
                    <div class="perfil-curso-info">
                        <span class="perfil-curso-titulo">${curso.titulo}</span>
                        <div class="perfil-curso-meta">
                            ${selosNivel}
                        </div>
                    </div>
                    <div class="anel-progresso pequeno" style="--progresso: ${matricula.progresso};">
                        <span class="anel-progresso-valor">${matricula.progresso}%</span>
                    </div>
                    <span class="perfil-curso-status">${rotuloStatus}</span>
                    <a href="./curso-detalhes.html?id=${curso.id}" class="btn btn-secundario btn-pequeno">Ver curso</a>
                </div>
            `;
        }).join('');
    }

    renderizarMeusCursos();

    // ===================================================================
    // FORMULÁRIO DE EDIÇÃO
    // ===================================================================
    const formPerfil = document.querySelector('#formPerfil');
    const nomePerfilInput = document.querySelector('#nomePerfil');
    const senhaAtualPerfilInput = document.querySelector('#senhaAtualPerfil');
    const novaSenhaPerfilInput = document.querySelector('#novaSenhaPerfil');
    const confirmarSenhaPerfilInput = document.querySelector('#confirmarSenhaPerfil');

    const erroNomePerfil = document.querySelector('#erroNomePerfil');
    const erroSenhaAtualPerfil = document.querySelector('#erroSenhaAtualPerfil');
    const erroNovaSenhaPerfil = document.querySelector('#erroNovaSenhaPerfil');
    const erroConfirmarSenhaPerfil = document.querySelector('#erroConfirmarSenhaPerfil');

    function limparErro(input, spanErro) {
        input.classList.remove('erro');
        spanErro.classList.remove('visivel');
    }

    function mostrarErro(input, spanErro) {
        input.classList.add('erro');
        spanErro.classList.add('visivel');
    }

    document.querySelector('#btnCancelarPerfil').addEventListener('click', () => {
        window.location.reload();
    });

    formPerfil.addEventListener('submit', async (event) => {
        event.preventDefault();

        const novoNome = nomePerfilInput.value.trim();
        const senhaAtual = senhaAtualPerfilInput.value;
        const novaSenha = novaSenhaPerfilInput.value;
        const confirmarNovaSenha = confirmarSenhaPerfilInput.value;

        [nomePerfilInput, senhaAtualPerfilInput, novaSenhaPerfilInput, confirmarSenhaPerfilInput].forEach((campo) => campo.classList.remove('erro'));
        [erroNomePerfil, erroSenhaAtualPerfil, erroNovaSenhaPerfil, erroConfirmarSenhaPerfil].forEach((span) => span.classList.remove('visivel'));

        let valido = true;

        if (!Utils.Texto.tamanhoValido(novoNome, 3, 150)) {
            mostrarErro(nomePerfilInput, erroNomePerfil);
            valido = false;
        }

        if (!Utils.Texto.naoVazio(senhaAtual) || senhaAtual !== usuarioCompleto.senha) {
            mostrarErro(senhaAtualPerfilInput, erroSenhaAtualPerfil);
            valido = false;
        }

        // Nova senha é opcional — só valida se a pessoa preencheu algo
        if (novaSenha.length > 0) {
            if (!Utils.Texto.tamanhoValido(novaSenha, 6, 100)) {
                mostrarErro(novaSenhaPerfilInput, erroNovaSenhaPerfil);
                valido = false;
            }

            if (novaSenha !== confirmarNovaSenha) {
                mostrarErro(confirmarSenhaPerfilInput, erroConfirmarSenhaPerfil);
                valido = false;
            }
        }

        if (!valido) return;

        const dadosAtualizados = {
            ...usuarioCompleto,
            nome: novoNome,
            senha: novaSenha.length > 0 ? novaSenha : usuarioCompleto.senha,
        };

        const resultado = await ApiUsuarios.atualizar(usuarioCompleto.id, dadosAtualizados);

        if (!resultado) {
            animacoes.mostrarToast('erro', 'Falha ao atualizar', 'Tente novamente em instantes.');
            return;
        }

        usuarioCompleto.nome = resultado.nome;
        usuarioCompleto.senha = resultado.senha;

        // Atualiza também a sessão salva no localStorage (o nome pode ter mudado)
        localStorage.setItem('usuarioLogado', JSON.stringify({
            id: resultado.id,
            nome: resultado.nome,
            email: resultado.email,
            role: resultado.role,
        }));

        renderizarInformacoes(usuarioCompleto);
        preencherNavbar(usuarioCompleto);

        senhaAtualPerfilInput.value = '';
        novaSenhaPerfilInput.value = '';
        confirmarSenhaPerfilInput.value = '';

        animacoes.mostrarToast('sucesso', 'Perfil atualizado', 'Suas informações foram salvas com sucesso.');
    });

});
