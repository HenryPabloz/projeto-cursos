/**
 * catalogo.js — Tela de Catálogo de Cursos.
 * Busca cursos, categorias, usuários e matrículas na API e monta os
 * cards dinamicamente, aplicando busca, filtro de categoria e ordenação.
 */

document.addEventListener('DOMContentLoaded', async () => {

    const usuario = exigirLogin();
    if (!usuario) return;

    preencherNavbar(usuario);
    configurarDropdownNavbar();
    configurarMenuMobile();

    const gridCursos = document.querySelector('#gridCursos');
    const catalogoVazio = document.querySelector('#catalogoVazio');
    const contagemResultados = document.querySelector('#contagemResultados');
    const filtroCategoria = document.querySelector('#filtroCategoria');
    const filtroNivel = document.querySelector('#filtroNivel');
    const ordenacaoCurso = document.querySelector('#ordenacaoCurso');
    const buscaCurso = document.querySelector('#buscaCurso');
    const formBusca = document.querySelector('.catalogo-busca');
    const paginacaoCursos = document.querySelector('#paginacaoCursos');

    // Paginação: 9 cursos por página; a partir de 6 páginas, ganham botões de Anterior/Próximo
    const CURSOS_POR_PAGINA = 9;
    const TOTAL_PAGINAS_PARA_MOSTRAR_SETAS = 6;
    let paginaAtual = 1;

    // Busca tudo que a tela precisa (sequencialmente, uma requisição de cada vez)
    const [todosOsCursos, categorias, usuarios, matriculas, avaliacoes] = await Promise.all([
        ApiCursos.listar(),
        ApiCategorias.listar(),
        ApiUsuarios.listar(),
        ApiMatriculas.listar(),
        ApiAvaliacoes.listar(),
    ]);

    if (!todosOsCursos || !categorias || !usuarios || !matriculas || !avaliacoes) {
        animacoes.mostrarToast('erro', 'Erro ao carregar', 'Não foi possível conectar ao servidor. Verifique se o json-server está rodando.');
        contagemResultados.textContent = 'Não foi possível carregar os cursos.';
        return;
    }

    // Só nos interessam cursos publicados no catálogo
    const cursosPublicados = todosOsCursos.filter((curso) => curso.status === 'publicado');

    // Só as matrículas do usuário logado
    const matriculasDoUsuario = matriculas.filter((matricula) => matricula.usuarioId === usuario.id);

    // Mapas simples de "id" para os dados relacionados, evitando repetir buscas
    const mapaCategorias = {};
    categorias.forEach((categoria) => {
        mapaCategorias[categoria.id] = categoria.nome;
    });

    // Cada categoria recebe um dos 5 gradientes do design system, sempre o mesmo
    const totalGradientes = 5;
    const mapaGradienteCategoria = {};
    categorias.forEach((categoria, indice) => {
        mapaGradienteCategoria[categoria.id] = `var(--gradiente-${(indice % totalGradientes) + 1})`;
    });

    const mapaUsuarios = {};
    usuarios.forEach((usuarioItem) => {
        mapaUsuarios[usuarioItem.id] = usuarioItem;
    });

    const mapaMatriculasPorCurso = {};
    matriculasDoUsuario.forEach((matricula) => {
        mapaMatriculasPorCurso[matricula.cursoId] = matricula;
    });

    // Calcula a nota média de cada curso a partir das avaliações
    const mapaMediaAvaliacao = {};
    cursosPublicados.forEach((curso) => {
        const avaliacoesDoCurso = avaliacoes.filter((avaliacao) => avaliacao.cursoId === curso.id);

        if (avaliacoesDoCurso.length === 0) {
            mapaMediaAvaliacao[curso.id] = 0;
            return;
        }

        let somaNotas = 0;
        avaliacoesDoCurso.forEach((avaliacao) => {
            somaNotas += avaliacao.nota;
        });

        mapaMediaAvaliacao[curso.id] = somaNotas / avaliacoesDoCurso.length;
    });

    // Preenche o filtro de categorias com as categorias que realmente têm curso publicado
    const idsCategoriasComCurso = [];
    cursosPublicados.forEach((curso) => {
        if (!idsCategoriasComCurso.includes(curso.categoriaId)) {
            idsCategoriasComCurso.push(curso.categoriaId);
        }
    });

    idsCategoriasComCurso.forEach((idCategoria) => {
        const opcao = document.createElement('option');
        opcao.value = idCategoria;
        opcao.textContent = mapaCategorias[idCategoria] || 'Categoria';
        filtroCategoria.appendChild(opcao);
    });

    // Constrói o HTML de um único card de curso
    function montarCardCurso(curso) {
        const instrutor = mapaUsuarios[curso.instrutorId];
        const nomeInstrutor = instrutor ? instrutor.nome : 'Instrutor';
        const iniciaisInstrutor = nomeInstrutor
            .split(' ')
            .slice(0, 2)
            .map((parte) => parte.charAt(0).toUpperCase())
            .join('');

        const nomeCategoria = mapaCategorias[curso.categoriaId] || 'Categoria';
        const gradienteCategoria = mapaGradienteCategoria[curso.categoriaId] || 'var(--gradiente-1)';
        const matricula = mapaMatriculasPorCurso[curso.id];

        // Cursos da Pokémon Academy têm um Pokémon como identificador visual de nível
        let selosPokemon = '';
        if (curso.pokemon) {
            selosPokemon = `
                <div class="catalogo-card-pokemon">
                    <img src="${curso.pokemon.spriteUrl}" alt="${curso.pokemon.nome}" class="catalogo-card-pokemon-sprite" title="${curso.pokemon.nome}">
                    <span class="catalogo-card-nivel" style="background-color: ${curso.corNivel};">${curso.nivel}</span>
                </div>
            `;
        }

        let blocoAcao = '';

        if (matricula) {
            const rotuloStatus = matricula.status === 'concluído' ? 'Concluído' : 'Em andamento';

            blocoAcao = `
                <div class="catalogo-card-status-matricula">
                    <div class="anel-progresso pequeno" style="--progresso: ${matricula.progresso};">
                        <span class="anel-progresso-valor">${matricula.progresso}%</span>
                    </div>
                    <div class="catalogo-card-status-texto">
                        <strong>Matriculado</strong>
                        ${rotuloStatus}
                    </div>
                </div>
                <div class="card-footer">
                    <a href="./curso-detalhes.html?id=${curso.id}" class="btn btn-secundario btn-bloco">Ver curso</a>
                </div>
            `;
        } else {
            blocoAcao = `
                <div class="card-footer" style="margin-top: auto;">
                    <button type="button" class="btn btn-primario btn-bloco js-btn-matricular" data-curso-id="${curso.id}">Matricular</button>
                </div>
            `;
        }

        return `
            <article class="card catalogo-card-curso">
                <div class="card-header">
                    <div>
                        <span class="catalogo-card-categoria" style="background: ${gradienteCategoria};">${nomeCategoria}</span>
                        <h3 class="card-titulo">${curso.titulo}</h3>
                    </div>
                    <div class="catalogo-card-cabecalho-direita">
                        <span class="badge badge-publicado"><span class="badge-ponto"></span>Publicado</span>
                        ${selosPokemon}
                    </div>
                </div>
                <p class="catalogo-card-descricao">${curso.descricao}</p>
                <div class="catalogo-card-instrutor">
                    <span class="catalogo-card-avatar">${iniciaisInstrutor}</span>
                    ${nomeInstrutor} · ${curso.cargaHoraria}h
                </div>
                ${blocoAcao}
            </article>
        `;
    }

    // Aplica busca + filtro de categoria + ordenação sobre a lista de cursos publicados
    function obterCursosFiltrados() {
        const termoBusca = buscaCurso.value.trim().toLowerCase();
        const categoriaEscolhida = filtroCategoria.value;
        const nivelEscolhido = filtroNivel.value;

        let resultado = cursosPublicados.filter((curso) => {
            const tituloBate = curso.titulo.toLowerCase().includes(termoBusca);
            const categoriaBate = !categoriaEscolhida || curso.categoriaId === categoriaEscolhida;
            const nivelBate = !nivelEscolhido || curso.nivel === nivelEscolhido;
            return tituloBate && categoriaBate && nivelBate;
        });

        const criterioOrdenacao = ordenacaoCurso.value;

        if (criterioOrdenacao === 'nome-az') {
            resultado.sort((a, b) => a.titulo.localeCompare(b.titulo));
        } else if (criterioOrdenacao === 'avaliacao') {
            resultado.sort((a, b) => mapaMediaAvaliacao[b.id] - mapaMediaAvaliacao[a.id]);
        }
        // 'recentes' mantém a ordem original vinda da API

        return resultado;
    }

    // Monta os botões de paginação (só aparecem quando há mais de 1 página)
    function renderizarPaginacao(totalDeCursos) {
        const totalPaginas = Math.ceil(totalDeCursos / CURSOS_POR_PAGINA);

        if (totalPaginas <= 1) {
            paginacaoCursos.innerHTML = '';
            return;
        }

        const mostrarSetas = totalPaginas >= TOTAL_PAGINAS_PARA_MOSTRAR_SETAS;

        let botoesNumeros = '';
        for (let numeroPagina = 1; numeroPagina <= totalPaginas; numeroPagina++) {
            const classeAtivo = numeroPagina === paginaAtual ? 'ativo' : '';
            botoesNumeros += `<button type="button" class="paginacao-item ${classeAtivo}" data-pagina="${numeroPagina}">${numeroPagina}</button>`;
        }

        let botaoAnterior = '';
        let botaoProximo = '';

        if (mostrarSetas) {
            const desabilitarAnterior = paginaAtual === 1 ? 'disabled' : '';
            const desabilitarProximo = paginaAtual === totalPaginas ? 'disabled' : '';
            botaoAnterior = `<button type="button" class="paginacao-item" data-pagina="anterior" ${desabilitarAnterior}>‹ Anterior</button>`;
            botaoProximo = `<button type="button" class="paginacao-item" data-pagina="proximo" ${desabilitarProximo}>Próximo ›</button>`;
        }

        paginacaoCursos.innerHTML = `${botaoAnterior}${botoesNumeros}${botaoProximo}`;
    }

    // Desenha a lista de cursos filtrada (e paginada) na tela
    function renderizarCatalogo() {
        const cursosFiltrados = obterCursosFiltrados();
        const totalPaginas = Math.max(1, Math.ceil(cursosFiltrados.length / CURSOS_POR_PAGINA));

        if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

        const indiceInicial = (paginaAtual - 1) * CURSOS_POR_PAGINA;
        const cursosDaPagina = cursosFiltrados.slice(indiceInicial, indiceInicial + CURSOS_POR_PAGINA);

        gridCursos.innerHTML = cursosDaPagina.map(montarCardCurso).join('');

        contagemResultados.textContent = `${cursosFiltrados.length} curso(s) publicado(s)`;

        if (cursosFiltrados.length === 0) {
            catalogoVazio.classList.remove('oculto');
        } else {
            catalogoVazio.classList.add('oculto');
        }

        renderizarPaginacao(cursosFiltrados.length);
        animacoes.animarEntradaPagina();
        animacoes.animarHoverCard();
    }

    renderizarCatalogo();

    // Reagir aos filtros (qualquer mudança de filtro volta para a primeira página)
    function reagirAFiltro() {
        paginaAtual = 1;
        renderizarCatalogo();
    }

    filtroCategoria.addEventListener('change', reagirAFiltro);
    filtroNivel.addEventListener('change', reagirAFiltro);
    ordenacaoCurso.addEventListener('change', reagirAFiltro);
    buscaCurso.addEventListener('input', reagirAFiltro);
    formBusca.addEventListener('submit', (event) => {
        event.preventDefault();
        reagirAFiltro();
    });

    // Clique nos botões de paginação
    paginacaoCursos.addEventListener('click', (event) => {
        const botao = event.target.closest('.paginacao-item');
        if (!botao || botao.disabled) return;

        const alvo = botao.dataset.pagina;
        const totalPaginas = Math.max(1, Math.ceil(obterCursosFiltrados().length / CURSOS_POR_PAGINA));

        if (alvo === 'anterior') {
            paginaAtual = Math.max(1, paginaAtual - 1);
        } else if (alvo === 'proximo') {
            paginaAtual = Math.min(totalPaginas, paginaAtual + 1);
        } else {
            paginaAtual = Number(alvo);
        }

        renderizarCatalogo();
        gridCursos.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Clique em "Matricular" (delegado no grid, já que os cards são recriados)
    gridCursos.addEventListener('click', async (event) => {
        const botao = event.target.closest('.js-btn-matricular');
        if (!botao) return;

        const cursoId = botao.dataset.cursoId;

        botao.disabled = true;
        botao.textContent = 'Matriculando...';

        const novaMatricula = await ApiMatriculas.criar({
            usuarioId: usuario.id,
            cursoId: cursoId,
            dataMatricula: new Date().toISOString(),
            progresso: 0,
            status: 'em andamento',
        });

        if (!novaMatricula) {
            animacoes.mostrarToast('erro', 'Falha ao matricular', 'Tente novamente em instantes.');
            botao.disabled = false;
            botao.textContent = 'Matricular';
            return;
        }

        mapaMatriculasPorCurso[cursoId] = novaMatricula;
        animacoes.mostrarToast('sucesso', 'Matrícula confirmada', 'Você já pode começar a estudar!');
        renderizarCatalogo();
    });

});
