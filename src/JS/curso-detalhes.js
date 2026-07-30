/**
 * curso-detalhes.js — Tela de Detalhes do Curso.
 * Lê o "id" do curso na URL, busca tudo relacionado a ele na API
 * (categoria, instrutor, aulas, matrícula do usuário, avaliações) e
 * monta a tela — incluindo matricular-se, marcar progresso e avaliar.
 */

document.addEventListener('DOMContentLoaded', async () => {

    const usuario = exigirLogin();
    if (!usuario) return;

    preencherNavbar(usuario);
    configurarDropdownNavbar();
    configurarMenuMobile();

    const parametros = new URLSearchParams(window.location.search);
    const cursoId = parametros.get('id');

    if (!cursoId) {
        window.location.href = './catalogo-cursos.html';
        return;
    }

    const curso = await ApiCursos.buscarPorId(cursoId);

    if (!curso) {
        animacoes.mostrarToast('erro', 'Curso não encontrado', 'Você será redirecionado para o catálogo.');
        setTimeout(() => window.location.href = './catalogo-cursos.html', 1500);
        return;
    }

    const [categoria, instrutor, todasAsAulas, todasAsMatriculas, todasAsAvaliacoes] = await Promise.all([
        ApiCategorias.buscarPorId(curso.categoriaId),
        ApiUsuarios.buscarPorId(curso.instrutorId),
        ApiAulas.listar(),
        ApiMatriculas.listar(),
        ApiAvaliacoes.listar(),
    ]);

    // categoria/instrutor podem legitimamente vir null (foram excluídos); já as
    // listas abaixo só vêm null se a requisição falhou de verdade
    if (!todasAsAulas || !todasAsMatriculas || !todasAsAvaliacoes) {
        animacoes.mostrarToast('erro', 'Erro ao carregar', 'Não foi possível carregar os dados do curso. Verifique se o json-server está rodando e recarregue a página.');
        return;
    }

    const aulasDoCurso = todasAsAulas
        .filter((aula) => aula.cursoId === cursoId)
        .sort((a, b) => a.ordem - b.ordem);

    const matriculasDoCurso = todasAsMatriculas.filter((matricula) => matricula.cursoId === cursoId);
    let matriculaAtual = matriculasDoCurso.find((matricula) => matricula.usuarioId === usuario.id) || null;

    let avaliacoesDoCurso = todasAsAvaliacoes.filter((avaliacao) => avaliacao.cursoId === cursoId);
    let jaAvaliou = avaliacoesDoCurso.some((avaliacao) => avaliacao.usuarioId === usuario.id);

    // Elementos fixos da página
    const cursoHeroAcoes = document.querySelector('#cursoHeroAcoes');
    const cardProgresso = document.querySelector('#cardProgresso');
    const listaAulas = document.querySelector('#listaAulas');
    const resumoAvaliacoes = document.querySelector('#resumoAvaliacoes');
    const listaAvaliacoes = document.querySelector('#listaAvaliacoes');

    function estrelasTexto(nota) {
        return '★'.repeat(nota) + '☆'.repeat(5 - nota);
    }

    // ===================================================================
    // CABEÇALHO (HERO) — dados que não mudam depois de carregados
    // ===================================================================
    document.title = `${curso.titulo} — Game Academy`;
    document.querySelector('#breadcrumbCurso').textContent = curso.titulo;
    document.querySelector('#cursoCategoria').textContent = categoria ? categoria.nome : 'Categoria';
    document.querySelector('#cursoTitulo').textContent = curso.titulo;
    document.querySelector('#cursoDescricao').textContent = curso.descricao;
    document.querySelector('#cursoInstrutor').textContent = instrutor ? instrutor.nome : 'Instrutor';
    document.querySelector('#cursoCargaHoraria').textContent = `${curso.cargaHoraria}h`;
    document.querySelector('#cursoTotalAulas').textContent = aulasDoCurso.length;
    document.querySelector('#cursoTotalAlunos').textContent = matriculasDoCurso.length;

    document.querySelector('#infoInstrutor').innerHTML = `
        <span class="catalogo-card-avatar">${instrutor ? instrutor.nome.split(' ').slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') : '--'}</span>
        ${instrutor ? instrutor.nome : 'Instrutor'}
    `;

    // Cursos da Pokémon Academy têm um Pokémon como identificador visual de nível
    if (curso.pokemon) {
        document.querySelector('#cursoPokemon').innerHTML = `
            <img src="${curso.pokemon.spriteUrl}" alt="${curso.pokemon.nome}" class="curso-hero-pokemon-sprite" title="${curso.pokemon.nome}">
            <span class="curso-hero-pokemon-nivel" style="background-color: ${curso.corNivel};">${curso.nivel}</span>
        `;
    }

    // Mario correndo pela faixa do hero — velocidade de acordo com o nível do curso
    animacoes.animarMarioRunner(curso.nivel);

    // ===================================================================
    // FUNÇÕES QUE DEPENDEM DO ESTADO DA MATRÍCULA (mudam durante o uso)
    // ===================================================================

    // Quantas aulas já estão concluídas, calculado a partir do progresso salvo
    function calcularAulasConcluidas() {
        if (!matriculaAtual || aulasDoCurso.length === 0) return 0;
        return Math.round((matriculaAtual.progresso / 100) * aulasDoCurso.length);
    }

    // Porcentagem exibida na tela: sempre recalculada a partir das aulas concluídas,
    // para nunca destoar do "X de Y aulas concluídas" mostrado ao lado.
    function calcularPercentualProgresso() {
        if (!matriculaAtual || aulasDoCurso.length === 0) return 0;
        return Math.round((calcularAulasConcluidas() / aulasDoCurso.length) * 100);
    }

    // Botões do hero: Matricular OU Continuar estudando / Atualizar progresso
    function renderizarAcoesHero() {
        if (!matriculaAtual) {
            cursoHeroAcoes.innerHTML = `
                <button type="button" class="btn btn-primario" id="btnMatricular">Matricular-se neste curso</button>
            `;
            return;
        }

        cursoHeroAcoes.innerHTML = `
            <button type="button" class="btn btn-primario" id="btnContinuarEstudando">Continuar estudando</button>
            <button type="button" class="btn btn-secundario" style="border-color: rgba(255,255,255,0.5); color: #fff;" id="btnAtualizarProgresso">Marcar próxima aula como concluída</button>
        `;
    }

    // Card lateral: progresso, ou convite para avaliar, ou aviso de matrícula
    function renderizarCardProgresso() {
        if (!matriculaAtual) {
            cardProgresso.innerHTML = `
                <h4 class="mb-md">Sobre este curso</h4>
                <p class="texto-suave texto-pequeno">Matricule-se para acompanhar seu progresso e liberar as avaliações.</p>
                <button type="button" class="btn btn-primario btn-bloco mt-lg" id="btnMatricularSidebar">Matricular-se</button>
            `;
            return;
        }

        const concluidas = calcularAulasConcluidas();

        let blocoExtra = '';

        if (matriculaAtual.status === 'concluído') {
            if (jaAvaliou) {
                blocoExtra = `<p class="texto-suave texto-pequeno mt-lg">✓ Você já avaliou este curso.</p>`;
            } else {
                blocoExtra = `<button type="button" class="btn btn-primario btn-bloco mt-lg" id="btnDeixarAvaliacao">Deixar avaliação</button>`;
            }
        } else {
            blocoExtra = `<p class="texto-suave texto-pequeno mt-lg">Conclua todas as aulas para poder avaliar o curso.</p>`;
        }

        const percentual = calcularPercentualProgresso();

        cardProgresso.innerHTML = `
            <h4 class="mb-md">Seu progresso</h4>
            <div class="anel-progresso curso-progresso-anel" id="anelProgresso" style="--progresso: ${percentual};">
                <span class="anel-progresso-valor">${percentual}%</span>
            </div>
            <p class="texto-suave texto-pequeno">${concluidas} de ${aulasDoCurso.length} aulas concluídas</p>
            ${blocoExtra}
        `;
    }

    // Lista de aulas, marcando como "concluída" as primeiras N (N = calcularAulasConcluidas)
    function renderizarAulas() {
        if (aulasDoCurso.length === 0) {
            listaAulas.innerHTML = `<p class="texto-suave">Este curso ainda não tem aulas cadastradas.</p>`;
            return;
        }

        const concluidas = calcularAulasConcluidas();

        listaAulas.innerHTML = aulasDoCurso.map((aula, indice) => {
            const estaConcluida = indice < concluidas;
            const numero = String(aula.ordem).padStart(2, '0');

            let situacao = `${aula.duracaoMinutos} min`;
            if (estaConcluida) situacao += ' · concluída';

            return `
                <div class="curso-aula-item ${estaConcluida ? 'concluida' : ''}">
                    <span class="curso-aula-numero">${numero}</span>
                    <div class="curso-aula-info">
                        <p class="curso-aula-titulo">${aula.titulo}</p>
                        <span class="curso-aula-duracao">${situacao}</span>
                    </div>
                    <button
                        type="button"
                        class="curso-aula-play js-marcar-aula"
                        data-indice="${indice}"
                        aria-label="${estaConcluida ? 'Aula já concluída' : `Marcar aula concluída: ${aula.titulo}`}"
                        ${!matriculaAtual ? 'disabled title="Matricule-se para assistir"' : ''}
                    >${estaConcluida ? '✓' : '▶'}</button>
                </div>
            `;
        }).join('');
    }

    // Resumo (nota média + estrelas) e lista de comentários da aba Avaliações
    function renderizarAvaliacoes() {
        if (avaliacoesDoCurso.length === 0) {
            resumoAvaliacoes.innerHTML = `<p class="texto-suave">Este curso ainda não tem avaliações.</p>`;
            listaAvaliacoes.innerHTML = '';
            return;
        }

        let somaNotas = 0;
        avaliacoesDoCurso.forEach((avaliacao) => somaNotas += avaliacao.nota);
        const media = somaNotas / avaliacoesDoCurso.length;
        const mediaArredondada = Math.round(media);

        resumoAvaliacoes.innerHTML = `
            <span class="curso-avaliacoes-nota">${media.toFixed(1)}</span>
            <div>
                <div class="curso-avaliacoes-estrelas" aria-label="${mediaArredondada} de 5 estrelas">${estrelasTexto(mediaArredondada)}</div>
                <span class="texto-suave texto-pequeno">${avaliacoesDoCurso.length} avaliação(ões)</span>
            </div>
        `;

        listaAvaliacoes.innerHTML = avaliacoesDoCurso.map((avaliacao) => {
            const autor = avaliacao.usuarioId === usuario.id ? usuario : { nome: 'Aluno da plataforma' };
            const iniciais = autor.nome.split(' ').slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');
            const dataFormatada = new Date(avaliacao.data).toLocaleDateString('pt-BR');

            return `
                <article class="curso-avaliacao-item">
                    <div class="curso-avaliacao-header">
                        <span class="curso-avaliacao-autor">
                            <span class="catalogo-card-avatar">${iniciais}</span>
                            ${autor.nome}
                        </span>
                        <span class="curso-avaliacao-data">${dataFormatada}</span>
                    </div>
                    <div class="curso-avaliacoes-estrelas" aria-label="${avaliacao.nota} de 5 estrelas">${estrelasTexto(avaliacao.nota)}</div>
                    <p class="curso-avaliacao-comentario">${avaliacao.comentario || ''}</p>
                </article>
            `;
        }).join('');
    }

    // Chama todas as funções que dependem do estado atual da matrícula
    function renderizarEstadoDoCurso() {
        renderizarAcoesHero();
        renderizarCardProgresso();
        renderizarAulas();
        animacoes.animarAnelProgresso(document.querySelector('#anelProgresso'), calcularPercentualProgresso());
    }

    renderizarEstadoDoCurso();
    renderizarAvaliacoes();
    animacoes.animarEntradaPagina();

    // ===================================================================
    // AÇÕES: matricular-se
    // ===================================================================
    async function matricularNoCurso() {
        const novaMatricula = await ApiMatriculas.criar({
            usuarioId: usuario.id,
            cursoId: cursoId,
            dataMatricula: new Date().toISOString(),
            progresso: 0,
            status: 'em andamento',
        });

        if (!novaMatricula) {
            animacoes.mostrarToast('erro', 'Falha ao matricular', 'Tente novamente em instantes.');
            return;
        }

        matriculaAtual = novaMatricula;
        animacoes.mostrarToast('sucesso', 'Matrícula confirmada', 'Você já pode começar a estudar!');
        renderizarEstadoDoCurso();
    }

    cursoHeroAcoes.addEventListener('click', (event) => {
        if (event.target.closest('#btnMatricular')) matricularNoCurso();
        if (event.target.closest('#btnContinuarEstudando')) {
            document.querySelector('#listaAulas').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        if (event.target.closest('#btnAtualizarProgresso')) marcarProximaAulaConcluida();
    });

    cardProgresso.addEventListener('click', (event) => {
        if (event.target.closest('#btnMatricularSidebar')) matricularNoCurso();
        if (event.target.closest('#btnDeixarAvaliacao')) abrirModalAvaliacao();
    });

    // ===================================================================
    // AÇÕES: marcar progresso das aulas
    // ===================================================================
    async function salvarProgresso(novoProgresso) {
        const novoStatus = novoProgresso >= 100 ? 'concluído' : 'em andamento';

        const matriculaAtualizada = await ApiMatriculas.atualizar(matriculaAtual.id, {
            ...matriculaAtual,
            progresso: novoProgresso,
            status: novoStatus,
        });

        if (!matriculaAtualizada) {
            animacoes.mostrarToast('erro', 'Falha ao salvar progresso', 'Tente novamente em instantes.');
            return;
        }

        matriculaAtual = matriculaAtualizada;
        animacoes.mostrarToast('sucesso', 'Progresso atualizado', `Você concluiu ${novoProgresso}% do curso.`);
        renderizarEstadoDoCurso();
    }

    function marcarProximaAulaConcluida() {
        if (!matriculaAtual) return;

        const concluidasAtualmente = calcularAulasConcluidas();

        if (concluidasAtualmente >= aulasDoCurso.length) {
            animacoes.mostrarToast('info', 'Curso já concluído', 'Você já assistiu a todas as aulas.');
            return;
        }

        const novoProgresso = Math.round(((concluidasAtualmente + 1) / aulasDoCurso.length) * 100);
        salvarProgresso(novoProgresso);
    }

    listaAulas.addEventListener('click', (event) => {
        const botao = event.target.closest('.js-marcar-aula');
        if (!botao || botao.disabled) return;

        const indiceClicado = Number(botao.dataset.indice);
        const concluidasAtualmente = calcularAulasConcluidas();

        if (indiceClicado < concluidasAtualmente) {
            animacoes.mostrarToast('info', 'Aula já concluída', 'Você já assistiu a esta aula.');
            return;
        }

        const novoProgresso = Math.round(((indiceClicado + 1) / aulasDoCurso.length) * 100);
        salvarProgresso(novoProgresso);
    });

    // ===================================================================
    // ABAS: Aulas / Avaliações
    // ===================================================================
    const abaAulas = document.querySelector('#abaAulas');
    const abaAvaliacoes = document.querySelector('#abaAvaliacoes');
    const secaoAvaliacoes = document.querySelector('#secaoAvaliacoes');

    abaAulas.addEventListener('click', () => {
        abaAulas.classList.add('ativa');
        abaAulas.setAttribute('aria-selected', 'true');
        abaAvaliacoes.classList.remove('ativa');
        abaAvaliacoes.setAttribute('aria-selected', 'false');
        listaAulas.classList.remove('oculto');
        secaoAvaliacoes.classList.add('oculto');
    });

    abaAvaliacoes.addEventListener('click', () => {
        abaAvaliacoes.classList.add('ativa');
        abaAvaliacoes.setAttribute('aria-selected', 'true');
        abaAulas.classList.remove('ativa');
        abaAulas.setAttribute('aria-selected', 'false');
        secaoAvaliacoes.classList.remove('oculto');
        listaAulas.classList.add('oculto');
    });

    // ===================================================================
    // MODAL: Deixar avaliação
    // ===================================================================
    const modalAvaliacao = document.querySelector('#modalAvaliacao');
    const grupoEstrelas = document.querySelector('#grupoEstrelas');
    const erroNotaAvaliacao = document.querySelector('#erroNotaAvaliacao');
    const comentarioAvaliacao = document.querySelector('#comentarioAvaliacao');
    const contadorComentario = document.querySelector('#contadorComentario');
    let notaSelecionada = 0;

    function abrirModalAvaliacao() {
        document.querySelector('#tituloModalAvaliacao').textContent = `Avaliar Curso: ${curso.titulo}`;
        modalAvaliacao.classList.add('aberto');
        animacoes.animarModalAbrir(modalAvaliacao.querySelector('.modal'));
    }

    function fecharModalAvaliacao() {
        const resultado = animacoes.animarModalFechar(modalAvaliacao.querySelector('.modal'));
        Promise.resolve(resultado).then(() => {
            modalAvaliacao.classList.remove('aberto');
            notaSelecionada = 0;
            atualizarEstrelasVisuais();
            comentarioAvaliacao.value = '';
            contadorComentario.textContent = '0/500';
            erroNotaAvaliacao.classList.remove('visivel');
        });
    }

    function atualizarEstrelasVisuais() {
        const estrelas = grupoEstrelas.querySelectorAll('.estrela');
        estrelas.forEach((estrela) => {
            const valor = Number(estrela.dataset.valor);
            const selecionada = valor <= notaSelecionada;
            estrela.classList.toggle('selecionada', selecionada);
            estrela.setAttribute('aria-checked', String(valor === notaSelecionada));
        });
    }

    grupoEstrelas.addEventListener('click', (event) => {
        const estrela = event.target.closest('.estrela');
        if (!estrela) return;
        notaSelecionada = Number(estrela.dataset.valor);
        erroNotaAvaliacao.classList.remove('visivel');
        atualizarEstrelasVisuais();
    });

    comentarioAvaliacao.addEventListener('input', () => {
        contadorComentario.textContent = `${comentarioAvaliacao.value.length}/500`;
    });

    document.querySelector('#btnFecharModalAvaliacao').addEventListener('click', fecharModalAvaliacao);
    document.querySelector('#btnCancelarAvaliacao').addEventListener('click', fecharModalAvaliacao);
    modalAvaliacao.addEventListener('click', (event) => {
        if (event.target === modalAvaliacao) fecharModalAvaliacao();
    });

    document.querySelector('#btnEnviarAvaliacao').addEventListener('click', async () => {
        if (notaSelecionada < 1 || notaSelecionada > 5) {
            erroNotaAvaliacao.classList.add('visivel');
            return;
        }

        const novaAvaliacao = await ApiAvaliacoes.criar({
            usuarioId: usuario.id,
            cursoId: cursoId,
            nota: notaSelecionada,
            comentario: comentarioAvaliacao.value.trim(),
            data: new Date().toISOString(),
        });

        if (!novaAvaliacao) {
            animacoes.mostrarToast('erro', 'Falha ao enviar avaliação', 'Tente novamente em instantes.');
            return;
        }

        avaliacoesDoCurso.push(novaAvaliacao);
        jaAvaliou = true;

        fecharModalAvaliacao();
        animacoes.mostrarToast('sucesso', 'Avaliação enviada', 'Obrigado por avaliar este curso!');
        renderizarAvaliacoes();
        renderizarCardProgresso();
    });

});
