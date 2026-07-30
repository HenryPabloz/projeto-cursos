/**
 * painel-admin.js — Painel Administrativo de Usuários.
 * Só carrega dados/CRUD se o usuário logado for "admin"; caso
 * contrário, exigirRole já mostra a tela de acesso negado.
 */

document.addEventListener('DOMContentLoaded', async () => {

    const usuarioLogado = exigirRole(['admin'], 'conteudoPainelAdmin', 'acessoNegadoAdmin');
    if (!usuarioLogado) return;

    preencherNavbar(usuarioLogado);

    const btnAbrirSidebar = document.querySelector('#btnAbrirSidebar');
    const sidebarPainel = document.querySelector('#sidebarPainel');
    if (btnAbrirSidebar) {
        btnAbrirSidebar.addEventListener('click', () => sidebarPainel.classList.toggle('aberta'));
    }

    const corpoUsuarios = document.querySelector('#corpoUsuarios');
    const paginacaoUsuarios = document.querySelector('#paginacaoUsuarios');
    const buscaUsuario = document.querySelector('#buscaUsuario');
    const filtroRole = document.querySelector('#filtroRole');

    let usuarios = [];
    let paginaUsuarios = 1;

    async function carregarDados() {
        const usuariosApi = await ApiUsuarios.listar();

        if (!usuariosApi) {
            animacoes.mostrarToast('erro', 'Erro ao carregar', 'Não foi possível conectar ao servidor. Verifique se o json-server está rodando e recarregue a página.');
            return;
        }

        usuarios = usuariosApi;
        renderizarEstatisticas();
        renderizarTabela();
    }

    function renderizarEstatisticas() {
        document.querySelector('#statTotalUsuarios').textContent = usuarios.length;
        document.querySelector('#statTotalAlunos').textContent = usuarios.filter((usuario) => usuario.role === 'aluno').length;
        document.querySelector('#statTotalEditores').textContent = usuarios.filter((usuario) => usuario.role === 'editor').length;
        document.querySelector('#statTotalAdmins').textContent = usuarios.filter((usuario) => usuario.role === 'admin').length;
    }

    function iniciaisDoNome(nome) {
        return nome.split(' ').slice(0, 2).map((parte) => parte.charAt(0).toUpperCase()).join('');
    }

    function renderizarTabela() {
        const termoBusca = buscaUsuario.value.trim().toLowerCase();
        const roleEscolhido = filtroRole.value;

        const usuariosFiltrados = usuarios.filter((usuario) => {
            const bateBusca = usuario.nome.toLowerCase().includes(termoBusca) || usuario.email.toLowerCase().includes(termoBusca);
            const bateRole = !roleEscolhido || usuario.role === roleEscolhido;
            return bateBusca && bateRole;
        });

        if (usuariosFiltrados.length === 0) {
            corpoUsuarios.innerHTML = `<tr><td colspan="4" class="tabela-vazia">Nenhum usuário encontrado.</td></tr>`;
            paginacaoUsuarios.innerHTML = '';
            return;
        }

        const totalPaginas = Utils.Paginacao.calcularTotalPaginas(usuariosFiltrados.length);
        if (paginaUsuarios > totalPaginas) paginaUsuarios = totalPaginas;

        const usuariosDaPagina = Utils.Paginacao.recortarPagina(usuariosFiltrados, paginaUsuarios);

        corpoUsuarios.innerHTML = usuariosDaPagina.map((usuario) => {
            const badgeStatus = usuario.ativo
                ? `<span class="badge badge-publicado"><span class="badge-ponto"></span>Ativo</span>`
                : `<span class="badge badge-rascunho"><span class="badge-ponto"></span>Inativo</span>`;

            // Nenhum usuário (aluno, editor ou admin) pode ser excluído de verdade
            // por aqui — só ativado/desativado (soft delete). Só cursos podem ser
            // excluídos de verdade, lá no painel do editor.
            const rotuloAcao = usuario.ativo ? 'Desativar usuário' : 'Ativar usuário';
            let botaoAcaoDestrutiva = `<button class="btn btn-icone js-alternar-status-usuario" data-id="${usuario.id}" aria-label="${rotuloAcao}"><img src="../IMG/tnt.png" class="icone-acao" alt=""></button>`;

            // Ninguém pode desativar a própria conta por aqui — evita se trancar para fora do painel
            const ehVoceMesmo = usuario.id === usuarioLogado.id;
            if (ehVoceMesmo) {
                botaoAcaoDestrutiva = '';
            }

            return `
                <tr>
                    <td data-label="Usuário">
                        <div class="painel-admin-tabela-usuario">
                            <span class="navbar-user-avatar">${iniciaisDoNome(usuario.nome)}</span>
                            <div class="painel-admin-tabela-usuario-info">
                                <strong>${usuario.nome}</strong>
                                <span class="painel-admin-tabela-email">${usuario.email}</span>
                            </div>
                        </div>
                    </td>
                    <td data-label="Role"><span class="badge badge-role-${usuario.role}">${usuario.role.charAt(0).toUpperCase() + usuario.role.slice(1)}</span></td>
                    <td data-label="Status">${badgeStatus}</td>
                    <td data-label="Ações">
                        <div class="tabela-acoes">
                            <button class="btn btn-icone js-editar-usuario" data-id="${usuario.id}" aria-label="Editar usuário"><img src="../IMG/pena.png" class="icone-acao" alt=""></button>
                            <div class="tabela-acao-secundaria">${botaoAcaoDestrutiva}</div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        paginacaoUsuarios.innerHTML = Utils.Paginacao.montarHtml(usuariosFiltrados.length, paginaUsuarios);

        // Os ícones do botão de ativar/desativar são inseridos dinamicamente,
        // então o Lucide precisa "desenhá-los" de novo a cada renderização
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function reagirAFiltroUsuario() {
        paginaUsuarios = 1;
        renderizarTabela();
    }

    buscaUsuario.addEventListener('input', reagirAFiltroUsuario);
    filtroRole.addEventListener('change', reagirAFiltroUsuario);

    paginacaoUsuarios.addEventListener('click', (event) => {
        const botao = event.target.closest('.paginacao-item');
        if (!botao || botao.disabled) return;

        const termoBusca = buscaUsuario.value.trim().toLowerCase();
        const roleEscolhido = filtroRole.value;
        const totalFiltrados = usuarios.filter((usuario) => {
            const bateBusca = usuario.nome.toLowerCase().includes(termoBusca) || usuario.email.toLowerCase().includes(termoBusca);
            const bateRole = !roleEscolhido || usuario.role === roleEscolhido;
            return bateBusca && bateRole;
        }).length;

        paginaUsuarios = Utils.Paginacao.calcularNovaPagina(botao.dataset.pagina, paginaUsuarios, totalFiltrados);
        renderizarTabela();
    });

    // ===================================================================
    // MODAL: Novo/Editar Usuário
    // ===================================================================
    const modalUsuario = document.querySelector('#modalUsuario');
    const nomeUsuarioInput = document.querySelector('#nomeUsuario');
    const emailUsuarioInput = document.querySelector('#emailUsuario');
    const senhaUsuarioInput = document.querySelector('#senhaUsuario');
    const roleUsuarioSelect = document.querySelector('#roleUsuario');
    const ativoUsuarioInput = document.querySelector('#ativoUsuario');
    const dicaSenhaUsuario = document.querySelector('#dicaSenhaUsuario');
    const dicaContaPropria = document.querySelector('#dicaContaPropria');
    const erroNomeUsuario = document.querySelector('#erroNomeUsuario');
    const erroEmailUsuario = document.querySelector('#erroEmailUsuario');
    const erroSenhaUsuario = document.querySelector('#erroSenhaUsuario');
    let usuarioEmEdicaoId = null;

    function abrirModalUsuario(usuario) {
        usuarioEmEdicaoId = usuario ? usuario.id : null;
        document.querySelector('#tituloModalUsuario').textContent = usuario ? 'Editar Usuário' : 'Novo Usuário';

        nomeUsuarioInput.value = usuario ? usuario.nome : '';
        emailUsuarioInput.value = usuario ? usuario.email : '';
        senhaUsuarioInput.value = '';
        roleUsuarioSelect.value = usuario ? usuario.role : 'aluno';
        ativoUsuarioInput.checked = usuario ? usuario.ativo : true;

        dicaSenhaUsuario.classList.toggle('oculto', !usuario);
        senhaUsuarioInput.placeholder = usuario ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres';

        // Editando a própria conta: role e status ficam travados, para não se
        // rebaixar ou se desativar sem querer e ficar trancado para fora do painel.
        const ehVoceMesmo = usuario && usuario.id === usuarioLogado.id;
        roleUsuarioSelect.disabled = ehVoceMesmo;
        ativoUsuarioInput.disabled = ehVoceMesmo;
        dicaContaPropria.classList.toggle('oculto', !ehVoceMesmo);

        [nomeUsuarioInput, emailUsuarioInput, senhaUsuarioInput].forEach((campo) => campo.classList.remove('erro'));
        [erroNomeUsuario, erroEmailUsuario, erroSenhaUsuario].forEach((span) => span.classList.remove('visivel'));

        modalUsuario.classList.add('aberto');
        animacoes.animarModalAbrir(modalUsuario.querySelector('.modal'));
    }

    function fecharModalUsuario() {
        const resultado = animacoes.animarModalFechar(modalUsuario.querySelector('.modal'));
        Promise.resolve(resultado).then(() => modalUsuario.classList.remove('aberto'));
    }

    document.querySelector('#btnNovoUsuario').addEventListener('click', () => abrirModalUsuario(null));
    document.querySelector('#btnFecharModalUsuario').addEventListener('click', fecharModalUsuario);
    document.querySelector('#btnCancelarUsuario').addEventListener('click', fecharModalUsuario);
    modalUsuario.addEventListener('click', (event) => {
        if (event.target === modalUsuario) fecharModalUsuario();
    });

    corpoUsuarios.addEventListener('click', async (event) => {
        const botaoEditar = event.target.closest('.js-editar-usuario');
        const botaoAlternarStatus = event.target.closest('.js-alternar-status-usuario');

        if (botaoEditar) {
            const usuario = usuarios.find((item) => item.id === botaoEditar.dataset.id);
            abrirModalUsuario(usuario);
        }

        if (botaoAlternarStatus) {
            const usuario = usuarios.find((item) => item.id === botaoAlternarStatus.dataset.id);
            const novoStatusAtivo = !usuario.ativo;

            const resultado = await ApiUsuarios.atualizar(usuario.id, { ...usuario, ativo: novoStatusAtivo });

            if (!resultado) {
                animacoes.mostrarToast('erro', 'Falha ao atualizar', 'Tente novamente em instantes.');
                return;
            }

            const mensagem = novoStatusAtivo ? 'Usuário ativado com sucesso.' : 'Usuário desativado com sucesso.';
            animacoes.mostrarToast('sucesso', 'Status atualizado', mensagem);
            await carregarDados();
        }
    });

    document.querySelector('#btnSalvarUsuario').addEventListener('click', async () => {
        const nome = nomeUsuarioInput.value.trim();
        const email = emailUsuarioInput.value.trim();
        const senha = senhaUsuarioInput.value;
        const role = roleUsuarioSelect.value;
        const ativo = ativoUsuarioInput.checked;

        let valido = true;

        if (!Utils.Texto.tamanhoValido(nome, 3, 150)) {
            nomeUsuarioInput.classList.add('erro');
            erroNomeUsuario.classList.add('visivel');
            valido = false;
        } else {
            nomeUsuarioInput.classList.remove('erro');
            erroNomeUsuario.classList.remove('visivel');
        }

        const emailJaExiste = usuarios.some((usuario) => {
            return usuario.email.toLowerCase() === email.toLowerCase() && usuario.id !== usuarioEmEdicaoId;
        });

        if (!Utils.Texto.ehEmailValido(email) || emailJaExiste) {
            emailUsuarioInput.classList.add('erro');
            erroEmailUsuario.textContent = emailJaExiste ? 'Este email já está cadastrado.' : 'Informe um email válido.';
            erroEmailUsuario.classList.add('visivel');
            valido = false;
        } else {
            emailUsuarioInput.classList.remove('erro');
            erroEmailUsuario.classList.remove('visivel');
        }

        // Senha é obrigatória ao criar; ao editar, só valida se algo foi digitado
        const precisaValidarSenha = !usuarioEmEdicaoId || senha.length > 0;
        if (precisaValidarSenha && !Utils.Texto.tamanhoValido(senha, 6, 100)) {
            senhaUsuarioInput.classList.add('erro');
            erroSenhaUsuario.classList.add('visivel');
            valido = false;
        } else {
            senhaUsuarioInput.classList.remove('erro');
            erroSenhaUsuario.classList.remove('visivel');
        }

        if (!valido) return;

        const dados = { nome, email, role, ativo };

        if (senha.length > 0) {
            dados.senha = senha;
        } else if (usuarioEmEdicaoId) {
            dados.senha = usuarios.find((usuario) => usuario.id === usuarioEmEdicaoId).senha;
        }

        let resultado;
        if (usuarioEmEdicaoId) {
            resultado = await ApiUsuarios.atualizar(usuarioEmEdicaoId, dados);
        } else {
            resultado = await ApiUsuarios.criar(dados);
        }

        if (!resultado) {
            animacoes.mostrarToast('erro', 'Falha ao salvar', 'Tente novamente em instantes.');
            return;
        }

        animacoes.mostrarToast('sucesso', 'Usuário salvo', `"${nome}" foi salvo com sucesso.`);
        fecharModalUsuario();
        await carregarDados();
    });

    await carregarDados();
});
