/**
 * painel-editor.js — Painel do Editor (CRUD de Categorias, Cursos e Aulas).
 * Só carrega dados/CRUD se o usuário logado for "editor" ou "admin";
 * caso contrário, exigirRole já mostra a tela de acesso negado.
 */

document.addEventListener('DOMContentLoaded', async () => {

    const usuario = exigirRole(['editor', 'admin'], 'conteudoPainelEditor', 'acessoNegadoEditor');
    if (!usuario) return;

    preencherNavbar(usuario);

    const btnAbrirSidebar = document.querySelector('#btnAbrirSidebar');
    const sidebarPainel = document.querySelector('#sidebarPainel');
    if (btnAbrirSidebar) {
        btnAbrirSidebar.addEventListener('click', () => sidebarPainel.classList.toggle('aberta'));
    }

    // Estado em memória (recarregado do zero após qualquer criação/edição/exclusão)
    let categorias = [];
    let cursos = [];
    let aulas = [];

    // Página atual de cada tabela (cada uma pagina de forma independente)
    let paginaCategorias = 1;
    let paginaCursos = 1;
    let paginaAulas = 1;

    async function carregarDados() {
        const [categoriasApi, cursosApi, aulasApi] = await Promise.all([
            ApiCategorias.listar(),
            ApiCursos.listar(),
            ApiAulas.listar(),
        ]);

        if (!categoriasApi || !cursosApi || !aulasApi) {
            animacoes.mostrarToast('erro', 'Erro ao carregar', 'Não foi possível conectar ao servidor. Verifique se o json-server está rodando e recarregue a página.');
            return;
        }

        categorias = categoriasApi;
        cursos = cursosApi;
        aulas = aulasApi;

        renderizarCategorias();
        renderizarCursos();
        popularSelectCategorias();
        popularSelectCursosDaAula();
        renderizarAulasDoCursoSelecionado();
    }

    function nomeCategoria(categoriaId) {
        const categoria = categorias.find((item) => item.id === categoriaId);
        return categoria ? categoria.nome : 'Categoria removida';
    }

    // ===================================================================
    // ABAS
    // ===================================================================
    document.querySelectorAll('.painel-editor-aba').forEach((aba) => {
        aba.addEventListener('click', () => {
            document.querySelectorAll('.painel-editor-aba').forEach((item) => item.classList.remove('ativa'));
            document.querySelectorAll('.painel-editor-secao').forEach((item) => item.classList.remove('ativa'));
            aba.classList.add('ativa');
            document.querySelector(`#${aba.dataset.alvo}`).classList.add('ativa');
        });
    });

    // ===================================================================
    // CATEGORIAS
    // ===================================================================
    const corpoCategorias = document.querySelector('#corpoCategorias');
    const paginacaoCategorias = document.querySelector('#paginacaoCategorias');
    const modalCategoria = document.querySelector('#modalCategoria');
    const nomeCategoriaInput = document.querySelector('#nomeCategoria');
    const descricaoCategoriaInput = document.querySelector('#descricaoCategoria');
    const erroNomeCategoria = document.querySelector('#erroNomeCategoria');
    let categoriaEmEdicaoId = null;

    function renderizarCategorias() {
        if (categorias.length === 0) {
            corpoCategorias.innerHTML = `<tr><td colspan="3" class="tabela-vazia">Nenhuma categoria cadastrada ainda.</td></tr>`;
            paginacaoCategorias.innerHTML = '';
            return;
        }

        const totalPaginas = Utils.Paginacao.calcularTotalPaginas(categorias.length);
        if (paginaCategorias > totalPaginas) paginaCategorias = totalPaginas;

        const categoriasDaPagina = Utils.Paginacao.recortarPagina(categorias, paginaCategorias);

        corpoCategorias.innerHTML = categoriasDaPagina.map((categoria) => `
            <tr>
                <td data-label="Nome">${categoria.nome}</td>
                <td data-label="Descrição">${categoria.descricao || '—'}</td>
                <td data-label="Ações">
                    <div class="tabela-acoes">
                        <button class="btn btn-icone js-editar-categoria" data-id="${categoria.id}" aria-label="Editar categoria"><img src="../IMG/pena.png" class="icone-acao" alt=""></button>
                        <button class="btn btn-icone js-excluir-categoria" data-id="${categoria.id}" aria-label="Excluir categoria"><img src="../IMG/tnt.png" class="icone-acao" alt=""></button>
                    </div>
                </td>
            </tr>
        `).join('');

        paginacaoCategorias.innerHTML = Utils.Paginacao.montarHtml(categorias.length, paginaCategorias);
    }

    paginacaoCategorias.addEventListener('click', (event) => {
        const botao = event.target.closest('.paginacao-item');
        if (!botao || botao.disabled) return;

        paginaCategorias = Utils.Paginacao.calcularNovaPagina(botao.dataset.pagina, paginaCategorias, categorias.length);
        renderizarCategorias();
    });

    function popularSelectCategorias() {
        const select = document.querySelector('#categoriaCurso');
        const valorAtual = select.value;
        select.innerHTML = '<option value="">Selecione...</option>' +
            categorias.map((categoria) => `<option value="${categoria.id}">${categoria.nome}</option>`).join('');
        select.value = valorAtual;
    }

    function abrirModalCategoria(categoria) {
        categoriaEmEdicaoId = categoria ? categoria.id : null;
        document.querySelector('#tituloModalCategoria').textContent = categoria ? 'Editar Categoria' : 'Nova Categoria';
        nomeCategoriaInput.value = categoria ? categoria.nome : '';
        descricaoCategoriaInput.value = categoria ? (categoria.descricao || '') : '';
        nomeCategoriaInput.classList.remove('erro');
        erroNomeCategoria.classList.remove('visivel');
        modalCategoria.classList.add('aberto');
        animacoes.animarModalAbrir(modalCategoria.querySelector('.modal'));
    }

    function fecharModalCategoria() {
        const resultado = animacoes.animarModalFechar(modalCategoria.querySelector('.modal'));
        Promise.resolve(resultado).then(() => modalCategoria.classList.remove('aberto'));
    }

    document.querySelector('#btnNovaCategoria').addEventListener('click', () => abrirModalCategoria(null));
    document.querySelector('#btnFecharModalCategoria').addEventListener('click', fecharModalCategoria);
    document.querySelector('#btnCancelarCategoria').addEventListener('click', fecharModalCategoria);
    modalCategoria.addEventListener('click', (event) => {
        if (event.target === modalCategoria) fecharModalCategoria();
    });

    corpoCategorias.addEventListener('click', (event) => {
        const botaoEditar = event.target.closest('.js-editar-categoria');
        const botaoExcluir = event.target.closest('.js-excluir-categoria');

        if (botaoEditar) {
            const categoria = categorias.find((item) => item.id === botaoEditar.dataset.id);
            abrirModalCategoria(categoria);
        }

        if (botaoExcluir) {
            const categoria = categorias.find((item) => item.id === botaoExcluir.dataset.id);
            abrirConfirmacaoExclusao('categoria', categoria.id, categoria.nome);
        }
    });

    document.querySelector('#btnSalvarCategoria').addEventListener('click', async () => {
        const nome = nomeCategoriaInput.value.trim();

        const nomeJaExiste = categorias.some((categoria) => {
            return categoria.nome.toLowerCase() === nome.toLowerCase() && categoria.id !== categoriaEmEdicaoId;
        });

        if (!Utils.Texto.tamanhoValido(nome, 3, 100) || nomeJaExiste) {
            nomeCategoriaInput.classList.add('erro');
            erroNomeCategoria.textContent = nomeJaExiste
                ? 'Já existe uma categoria com esse nome.'
                : 'Informe um nome (mínimo 3 caracteres).';
            erroNomeCategoria.classList.add('visivel');
            return;
        }

        const dados = { nome, descricao: descricaoCategoriaInput.value.trim() };

        let resultado;
        if (categoriaEmEdicaoId) {
            resultado = await ApiCategorias.atualizar(categoriaEmEdicaoId, dados);
        } else {
            resultado = await ApiCategorias.criar(dados);
        }

        if (!resultado) {
            animacoes.mostrarToast('erro', 'Falha ao salvar', 'Tente novamente em instantes.');
            return;
        }

        animacoes.mostrarToast('sucesso', 'Categoria salva', `"${nome}" foi salva com sucesso.`);
        fecharModalCategoria();
        await carregarDados();
    });

    // ===================================================================
    // CURSOS
    // ===================================================================
    const corpoCursos = document.querySelector('#corpoCursos');
    const paginacaoCursosEditor = document.querySelector('#paginacaoCursos');
    const modalCurso = document.querySelector('#modalCurso');
    const tituloCursoInput = document.querySelector('#tituloCurso');
    const descricaoCursoInput = document.querySelector('#descricaoCurso');
    const categoriaCursoSelect = document.querySelector('#categoriaCurso');
    const cargaHorariaCursoInput = document.querySelector('#cargaHorariaCurso');
    const erroTituloCurso = document.querySelector('#erroTituloCurso');
    const erroCategoriaCurso = document.querySelector('#erroCategoriaCurso');
    const erroCargaHorariaCurso = document.querySelector('#erroCargaHorariaCurso');
    let cursoEmEdicaoId = null;

    function renderizarCursos() {
        if (cursos.length === 0) {
            corpoCursos.innerHTML = `<tr><td colspan="5" class="tabela-vazia">Nenhum curso cadastrado ainda.</td></tr>`;
            paginacaoCursosEditor.innerHTML = '';
            return;
        }

        const totalPaginas = Utils.Paginacao.calcularTotalPaginas(cursos.length);
        if (paginaCursos > totalPaginas) paginaCursos = totalPaginas;

        const cursosDaPagina = Utils.Paginacao.recortarPagina(cursos, paginaCursos);

        corpoCursos.innerHTML = cursosDaPagina.map((curso) => {
            const classeBadge = curso.status === 'publicado' ? 'badge-publicado' : 'badge-rascunho';
            const rotuloBadge = curso.status === 'publicado' ? 'Publicado' : 'Rascunho';

            let celulaNivel = '—';
            if (curso.pokemon) {
                celulaNivel = `
                    <span class="painel-editor-nivel-pokemon">
                        <img src="${curso.pokemon.spriteUrl}" alt="${curso.pokemon.nome}" title="${curso.pokemon.nome}">
                        <span class="painel-editor-nivel-selo" style="background-color: ${curso.corNivel};">${curso.nivel}</span>
                    </span>
                `;
            }

            return `
                <tr>
                    <td data-label="Título">${curso.titulo}</td>
                    <td data-label="Categoria">${nomeCategoria(curso.categoriaId)}</td>
                    <td data-label="Nível">${celulaNivel}</td>
                    <td data-label="Status"><span class="badge ${classeBadge}"><span class="badge-ponto"></span>${rotuloBadge}</span></td>
                    <td data-label="Ações">
                        <div class="tabela-acoes">
                            <button class="btn btn-icone js-editar-curso" data-id="${curso.id}" aria-label="Editar curso"><img src="../IMG/pena.png" class="icone-acao" alt=""></button>
                            <button class="btn btn-icone js-excluir-curso" data-id="${curso.id}" aria-label="Excluir curso"><img src="../IMG/tnt.png" class="icone-acao" alt=""></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        paginacaoCursosEditor.innerHTML = Utils.Paginacao.montarHtml(cursos.length, paginaCursos);
    }

    paginacaoCursosEditor.addEventListener('click', (event) => {
        const botao = event.target.closest('.paginacao-item');
        if (!botao || botao.disabled) return;

        paginaCursos = Utils.Paginacao.calcularNovaPagina(botao.dataset.pagina, paginaCursos, cursos.length);
        renderizarCursos();
    });

    function abrirModalCurso(curso) {
        cursoEmEdicaoId = curso ? curso.id : null;
        document.querySelector('#tituloModalCurso').textContent = curso ? 'Editar Curso' : 'Novo Curso';

        tituloCursoInput.value = curso ? curso.titulo : '';
        descricaoCursoInput.value = curso ? curso.descricao : '';
        categoriaCursoSelect.value = curso ? curso.categoriaId : '';
        cargaHorariaCursoInput.value = curso ? curso.cargaHoraria : '';

        const statusEscolhido = curso ? curso.status : 'rascunho';
        document.querySelectorAll('input[name="statusCurso"]').forEach((radio) => {
            radio.checked = radio.value === statusEscolhido;
        });

        const nivelEscolhido = curso && curso.nivel ? curso.nivel : 'Iniciante';
        document.querySelectorAll('input[name="nivelCurso"]').forEach((radio) => {
            radio.checked = radio.value === nivelEscolhido;
        });

        [tituloCursoInput, categoriaCursoSelect, cargaHorariaCursoInput].forEach((campo) => campo.classList.remove('erro'));
        [erroTituloCurso, erroCategoriaCurso, erroCargaHorariaCurso].forEach((span) => span.classList.remove('visivel'));

        modalCurso.classList.add('aberto');
        animacoes.animarModalAbrir(modalCurso.querySelector('.modal'));
    }

    function fecharModalCurso() {
        const resultado = animacoes.animarModalFechar(modalCurso.querySelector('.modal'));
        Promise.resolve(resultado).then(() => modalCurso.classList.remove('aberto'));
    }

    document.querySelector('#btnNovoCurso').addEventListener('click', () => abrirModalCurso(null));
    document.querySelector('#btnFecharModalCurso').addEventListener('click', fecharModalCurso);
    document.querySelector('#btnCancelarCurso').addEventListener('click', fecharModalCurso);
    modalCurso.addEventListener('click', (event) => {
        if (event.target === modalCurso) fecharModalCurso();
    });

    corpoCursos.addEventListener('click', (event) => {
        const botaoEditar = event.target.closest('.js-editar-curso');
        const botaoExcluir = event.target.closest('.js-excluir-curso');

        if (botaoEditar) {
            const curso = cursos.find((item) => item.id === botaoEditar.dataset.id);
            abrirModalCurso(curso);
        }

        if (botaoExcluir) {
            const curso = cursos.find((item) => item.id === botaoExcluir.dataset.id);
            abrirConfirmacaoExclusao('curso', curso.id, curso.titulo);
        }
    });

    document.querySelector('#btnSalvarCurso').addEventListener('click', async () => {
        const titulo = tituloCursoInput.value.trim();
        const categoriaId = categoriaCursoSelect.value;
        const cargaHoraria = cargaHorariaCursoInput.value;
        const status = document.querySelector('input[name="statusCurso"]:checked').value;
        const nivel = document.querySelector('input[name="nivelCurso"]:checked').value;

        let valido = true;

        if (!Utils.Texto.tamanhoValido(titulo, 5, 200)) {
            tituloCursoInput.classList.add('erro');
            erroTituloCurso.classList.add('visivel');
            valido = false;
        } else {
            tituloCursoInput.classList.remove('erro');
            erroTituloCurso.classList.remove('visivel');
        }

        if (!categoriaId) {
            categoriaCursoSelect.classList.add('erro');
            erroCategoriaCurso.classList.add('visivel');
            valido = false;
        } else {
            categoriaCursoSelect.classList.remove('erro');
            erroCategoriaCurso.classList.remove('visivel');
        }

        if (!Utils.Numero.ehPositivo(cargaHoraria)) {
            cargaHorariaCursoInput.classList.add('erro');
            erroCargaHorariaCurso.classList.add('visivel');
            valido = false;
        } else {
            cargaHorariaCursoInput.classList.remove('erro');
            erroCargaHorariaCurso.classList.remove('visivel');
        }

        if (!valido) return;

        const coresPorNivel = { 'Iniciante': '#10B981', 'Mediano': '#F59E0B', 'Avançado': '#EF4444' };

        // Pokémon "genérico" de cada nível, usado como identificador visual em cursos
        // criados por aqui (os 30 cursos da Pokémon Academy já vêm com o seu próprio).
        const pokemonPadraoPorNivel = {
            'Iniciante': { id: 25, nome: 'Pikachu', tipo: ['electric'], spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
            'Mediano': { id: 133, nome: 'Eevee', tipo: ['normal'], spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png' },
            'Avançado': { id: 130, nome: 'Gyarados', tipo: ['water', 'flying'], spriteUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png' },
        };

        const cursoExistente = cursoEmEdicaoId ? cursos.find((item) => item.id === cursoEmEdicaoId) : null;
        const pokemon = cursoExistente && cursoExistente.pokemon ? cursoExistente.pokemon : pokemonPadraoPorNivel[nivel];

        const dados = {
            ...cursoExistente,
            titulo,
            descricao: descricaoCursoInput.value.trim(),
            categoriaId,
            status,
            nivel,
            corNivel: coresPorNivel[nivel],
            pokemon,
            cargaHoraria: Number(cargaHoraria),
            instrutorId: cursoExistente ? cursoExistente.instrutorId : usuario.id,
        };

        let resultado;
        if (cursoEmEdicaoId) {
            resultado = await ApiCursos.atualizar(cursoEmEdicaoId, dados);
        } else {
            resultado = await ApiCursos.criar(dados);
        }

        if (!resultado) {
            animacoes.mostrarToast('erro', 'Falha ao salvar', 'Tente novamente em instantes.');
            return;
        }

        animacoes.mostrarToast('sucesso', 'Curso salvo', `"${titulo}" foi salvo com sucesso.`);
        fecharModalCurso();
        await carregarDados();
    });

    // ===================================================================
    // AULAS
    // ===================================================================
    const corpoAulas = document.querySelector('#corpoAulas');
    const paginacaoAulas = document.querySelector('#paginacaoAulas');
    const filtroAulaCurso = document.querySelector('#filtroAulaCurso');
    const modalAula = document.querySelector('#modalAula');
    const cursoDaAulaSelect = document.querySelector('#cursoDaAula');
    const tituloAulaInput = document.querySelector('#tituloAula');
    const conteudoAulaInput = document.querySelector('#conteudoAula');
    const ordemAulaInput = document.querySelector('#ordemAula');
    const duracaoAulaInput = document.querySelector('#duracaoAula');
    const erroTituloAula = document.querySelector('#erroTituloAula');
    const erroOrdemAula = document.querySelector('#erroOrdemAula');
    const erroDuracaoAula = document.querySelector('#erroDuracaoAula');
    let aulaEmEdicaoId = null;

    function popularSelectCursosDaAula() {
        const opcoes = cursos.map((curso) => `<option value="${curso.id}">${curso.titulo}</option>`).join('');

        const valorFiltroAtual = filtroAulaCurso.value;
        filtroAulaCurso.innerHTML = opcoes;
        if (valorFiltroAtual) filtroAulaCurso.value = valorFiltroAtual;

        const valorModalAtual = cursoDaAulaSelect.value;
        cursoDaAulaSelect.innerHTML = '<option value="">Selecione...</option>' + opcoes;
        if (valorModalAtual) cursoDaAulaSelect.value = valorModalAtual;
    }

    function renderizarAulasDoCursoSelecionado() {
        const cursoId = filtroAulaCurso.value;
        const aulasDoCurso = aulas
            .filter((aula) => aula.cursoId === cursoId)
            .sort((a, b) => a.ordem - b.ordem);

        if (aulasDoCurso.length === 0) {
            corpoAulas.innerHTML = `<tr><td colspan="4" class="tabela-vazia">Nenhuma aula cadastrada para este curso.</td></tr>`;
            paginacaoAulas.innerHTML = '';
            return;
        }

        const totalPaginas = Utils.Paginacao.calcularTotalPaginas(aulasDoCurso.length);
        if (paginaAulas > totalPaginas) paginaAulas = totalPaginas;

        const aulasDaPagina = Utils.Paginacao.recortarPagina(aulasDoCurso, paginaAulas);

        corpoAulas.innerHTML = aulasDaPagina.map((aula) => `
            <tr>
                <td data-label="Ordem">${aula.ordem}</td>
                <td data-label="Título">${aula.titulo}</td>
                <td data-label="Duração">${aula.duracaoMinutos} min</td>
                <td data-label="Ações">
                    <div class="tabela-acoes">
                        <button class="btn btn-icone js-editar-aula" data-id="${aula.id}" aria-label="Editar aula"><img src="../IMG/pena.png" class="icone-acao" alt=""></button>
                        <button class="btn btn-icone js-excluir-aula" data-id="${aula.id}" aria-label="Excluir aula"><img src="../IMG/tnt.png" class="icone-acao" alt=""></button>
                    </div>
                </td>
            </tr>
        `).join('');

        paginacaoAulas.innerHTML = Utils.Paginacao.montarHtml(aulasDoCurso.length, paginaAulas);
    }

    paginacaoAulas.addEventListener('click', (event) => {
        const botao = event.target.closest('.paginacao-item');
        if (!botao || botao.disabled) return;

        const cursoId = filtroAulaCurso.value;
        const totalDeAulasDoCurso = aulas.filter((aula) => aula.cursoId === cursoId).length;

        paginaAulas = Utils.Paginacao.calcularNovaPagina(botao.dataset.pagina, paginaAulas, totalDeAulasDoCurso);
        renderizarAulasDoCursoSelecionado();
    });

    filtroAulaCurso.addEventListener('change', () => {
        paginaAulas = 1;
        renderizarAulasDoCursoSelecionado();
    });

    function abrirModalAula(aula) {
        aulaEmEdicaoId = aula ? aula.id : null;
        document.querySelector('#tituloModalAula').textContent = aula ? 'Editar Aula' : 'Nova Aula';

        cursoDaAulaSelect.value = aula ? aula.cursoId : filtroAulaCurso.value;
        tituloAulaInput.value = aula ? aula.titulo : '';
        conteudoAulaInput.value = aula ? aula.conteudo : '';
        ordemAulaInput.value = aula ? aula.ordem : '';
        duracaoAulaInput.value = aula ? aula.duracaoMinutos : '';

        [tituloAulaInput, ordemAulaInput, duracaoAulaInput].forEach((campo) => campo.classList.remove('erro'));
        [erroTituloAula, erroOrdemAula, erroDuracaoAula].forEach((span) => span.classList.remove('visivel'));

        modalAula.classList.add('aberto');
        animacoes.animarModalAbrir(modalAula.querySelector('.modal'));
    }

    function fecharModalAula() {
        const resultado = animacoes.animarModalFechar(modalAula.querySelector('.modal'));
        Promise.resolve(resultado).then(() => modalAula.classList.remove('aberto'));
    }

    document.querySelector('#btnNovaAula').addEventListener('click', () => abrirModalAula(null));
    document.querySelector('#btnFecharModalAula').addEventListener('click', fecharModalAula);
    document.querySelector('#btnCancelarAula').addEventListener('click', fecharModalAula);
    modalAula.addEventListener('click', (event) => {
        if (event.target === modalAula) fecharModalAula();
    });

    corpoAulas.addEventListener('click', (event) => {
        const botaoEditar = event.target.closest('.js-editar-aula');
        const botaoExcluir = event.target.closest('.js-excluir-aula');

        if (botaoEditar) {
            const aula = aulas.find((item) => item.id === botaoEditar.dataset.id);
            abrirModalAula(aula);
        }

        if (botaoExcluir) {
            const aula = aulas.find((item) => item.id === botaoExcluir.dataset.id);
            abrirConfirmacaoExclusao('aula', aula.id, aula.titulo);
        }
    });

    document.querySelector('#btnSalvarAula').addEventListener('click', async () => {
        const cursoId = cursoDaAulaSelect.value;
        const titulo = tituloAulaInput.value.trim();
        const ordem = ordemAulaInput.value;
        const duracao = duracaoAulaInput.value;

        let valido = true;

        if (!Utils.Texto.naoVazio(titulo)) {
            tituloAulaInput.classList.add('erro');
            erroTituloAula.classList.add('visivel');
            valido = false;
        } else {
            tituloAulaInput.classList.remove('erro');
            erroTituloAula.classList.remove('visivel');
        }

        const ordemJaExiste = aulas.some((aula) => {
            return aula.cursoId === cursoId && aula.ordem === Number(ordem) && aula.id !== aulaEmEdicaoId;
        });

        if (!Utils.Numero.ehInteiro(ordem) || !Utils.Numero.ehPositivo(ordem) || ordemJaExiste) {
            ordemAulaInput.classList.add('erro');
            erroOrdemAula.textContent = ordemJaExiste
                ? 'Este curso já tem uma aula com essa ordem.'
                : 'Informe um número inteiro maior que zero.';
            erroOrdemAula.classList.add('visivel');
            valido = false;
        } else {
            ordemAulaInput.classList.remove('erro');
            erroOrdemAula.classList.remove('visivel');
        }

        if (!Utils.Numero.ehPositivo(duracao)) {
            duracaoAulaInput.classList.add('erro');
            erroDuracaoAula.classList.add('visivel');
            valido = false;
        } else {
            duracaoAulaInput.classList.remove('erro');
            erroDuracaoAula.classList.remove('visivel');
        }

        if (!cursoId || !valido) return;

        const dados = {
            cursoId,
            titulo,
            conteudo: conteudoAulaInput.value.trim(),
            ordem: Number(ordem),
            duracaoMinutos: Number(duracao),
        };

        let resultado;
        if (aulaEmEdicaoId) {
            resultado = await ApiAulas.atualizar(aulaEmEdicaoId, dados);
        } else {
            resultado = await ApiAulas.criar(dados);
        }

        if (!resultado) {
            animacoes.mostrarToast('erro', 'Falha ao salvar', 'Tente novamente em instantes.');
            return;
        }

        animacoes.mostrarToast('sucesso', 'Aula salva', `"${titulo}" foi salva com sucesso.`);
        fecharModalAula();
        filtroAulaCurso.value = cursoId;
        await carregarDados();
        filtroAulaCurso.value = cursoId;
        renderizarAulasDoCursoSelecionado();
    });

    // ===================================================================
    // CONFIRMAÇÃO DE EXCLUSÃO (compartilhada entre categoria/curso/aula)
    // ===================================================================
    const modalConfirmarExclusao = document.querySelector('#modalConfirmarExclusao');
    const mensagemConfirmarExclusao = document.querySelector('#mensagemConfirmarExclusao');
    let itemParaExcluir = null;

    function abrirConfirmacaoExclusao(tipo, id, nome) {
        itemParaExcluir = { tipo, id };

        let mensagem = `Tem certeza que deseja excluir "${nome}"? Esta ação não pode ser desfeita.`;
        if (tipo === 'curso') {
            mensagem = `Tem certeza que deseja excluir o curso "${nome}"? Suas aulas, matrículas e avaliações também serão excluídas. Esta ação não pode ser desfeita.`;
        }

        mensagemConfirmarExclusao.textContent = mensagem;
        modalConfirmarExclusao.classList.add('aberto');
        animacoes.animarModalAbrir(modalConfirmarExclusao.querySelector('.modal'));
    }

    function fecharConfirmacaoExclusao() {
        const resultado = animacoes.animarModalFechar(modalConfirmarExclusao.querySelector('.modal'));
        Promise.resolve(resultado).then(() => modalConfirmarExclusao.classList.remove('aberto'));
    }

    document.querySelector('#btnCancelarExclusao').addEventListener('click', fecharConfirmacaoExclusao);
    modalConfirmarExclusao.addEventListener('click', (event) => {
        if (event.target === modalConfirmarExclusao) fecharConfirmacaoExclusao();
    });

    // Ao excluir um curso, também exclui suas aulas, matrículas e avaliações —
    // sem isso, esses registros ficam órfãos no banco, apontando pra um curso
    // que não existe mais.
    async function excluirDependenciasDoCurso(cursoId) {
        const aulasDoCurso = aulas.filter((aula) => aula.cursoId === cursoId);
        const [matriculas, avaliacoes] = await Promise.all([
            ApiMatriculas.listar(),
            ApiAvaliacoes.listar(),
        ]);

        const matriculasDoCurso = (matriculas || []).filter((matricula) => matricula.cursoId === cursoId);
        const avaliacoesDoCurso = (avaliacoes || []).filter((avaliacao) => avaliacao.cursoId === cursoId);

        await Promise.all([
            ...aulasDoCurso.map((aula) => ApiAulas.excluir(aula.id)),
            ...matriculasDoCurso.map((matricula) => ApiMatriculas.excluir(matricula.id)),
            ...avaliacoesDoCurso.map((avaliacao) => ApiAvaliacoes.excluir(avaliacao.id)),
        ]);
    }

    document.querySelector('#btnConfirmarExclusao').addEventListener('click', async () => {
        if (!itemParaExcluir) return;

        const servicoPorTipo = {
            categoria: ApiCategorias,
            curso: ApiCursos,
            aula: ApiAulas,
        };

        const sucesso = await servicoPorTipo[itemParaExcluir.tipo].excluir(itemParaExcluir.id);

        if (!sucesso) {
            animacoes.mostrarToast('erro', 'Falha ao excluir', 'Tente novamente em instantes.');
            return;
        }

        if (itemParaExcluir.tipo === 'curso') {
            await excluirDependenciasDoCurso(itemParaExcluir.id);
        }

        animacoes.mostrarToast('sucesso', 'Item excluído', 'A exclusão foi concluída com sucesso.');
        fecharConfirmacaoExclusao();
        await carregarDados();
    });

    await carregarDados();
});
