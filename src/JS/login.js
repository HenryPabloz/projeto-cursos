/**
 * login.js
 * O roteiro completo (pseudocódigo) fica no bloco de comentários abaixo,
 * e a implementação de todos os passos (1 a 12) está mais abaixo, no
 * bloco de código.
 */

// ===================================================================
// PSEUDOCÓDIGO (roteiro completo da tela de login)
// ===================================================================

// 1. Ao carregar a página, verificar se já existe um usuário logado
//    - ler 'usuarioLogado' do localStorage
//    - SE existir, redirecionar direto para catalogo-cursos.html
//    (evita a pessoa logada ver a tela de login de novo)

// 2. Pegar os elementos do formulário
//    - o <form id="formLogin">
//    - o <input id="emailLogin">
//    - o <input id="senhaLogin">
//    - os <span class="form-erro"> de cada campo (para mostrar erro)

// 3. Escutar o evento "submit" do formulário
//    - dentro do evento, chamar preventDefault() para a página não recarregar

// 4. Validar os campos antes de qualquer requisição
//    - email: não pode estar vazio, precisa ter formato de email
//      (dica: já existe Utils.Texto.ehEmailValido em utils.js)
//    - senha: não pode estar vazia, mínimo 6 caracteres
//    - SE algum campo for inválido:
//      - adicionar a classe "erro" no input
//      - mostrar o <span class="form-erro"> correspondente (classe "visivel")
//      - PARAR aqui (return), não continuar para a requisição

// 5. Buscar a lista de usuários cadastrados
//    - usar ApiUsuarios.listar() (já pronto em api.js)
//    - isso é assíncrono: a função de submit precisa ser "async"
//      e essa chamada precisa de "await" na frente

// 6. Procurar, dentro da lista, um usuário cujo "email" bata com o
//    que foi digitado (comparar sempre em minúsculo, para evitar
//    erro por causa de maiúscula/minúscula)

// 7. SE não encontrar nenhum usuário com esse email:
//    - mostrar um erro (toast ou mensagem no formulário): "Email não encontrado"
//    - PARAR aqui

// 8. SE encontrar, comparar a senha digitada com o campo "senha" do usuário
//    - SE a senha estiver errada:
//      - mostrar erro: "Senha incorreta"
//      - PARAR aqui

// 9. SE o usuário existir e a senha bater:
//    - verificar se o usuário está "ativo" (campo ativo: true/false)
//    - SE estiver inativo, mostrar erro e PARAR aqui

// 10. Login deu certo: guardar os dados no localStorage
//     - salvar um objeto simples: { id, nome, email, role }
//     - usar a chave 'usuarioLogado'
//     - (não guardar a senha no localStorage!)

// 11. Redirecionar para a tela de catálogo
//     - window.location.href = '../HTML/catalogo-cursos.html' (ou caminho equivalente)

// 12. (Opcional/extra) Enquanto a requisição do passo 5 está rodando,
//     desabilitar o botão "Entrar" e mostrar um texto tipo "Entrando..."
//     - reabilitar o botão se der erro


// ===================================================================
// PSEUDOCÓDIGO: CADASTRO (modal "Criar conta")
// ===================================================================

// 1. Ao clicar em "Cadastre-se aqui", abrir o modal (mesmo padrão de
//    modal usado no resto do projeto: animarModalAbrir/Fechar)

// 2. Pegar os elementos do formulário: nome, email, senha,
//    confirmar senha, checkbox de termos

// 3. Escutar o clique no botão "Criar conta"

// 4. Validar todos os campos antes de qualquer requisição:
//    - nome: 3 a 100 caracteres
//    - email: formato válido
//    - senha: 6 a 50 caracteres
//    - confirmar senha: igual à senha
//    - termos: checkbox marcado
//    SE algum inválido: mostrar erro no campo e PARAR (return)

// 5. Buscar a lista de usuários (ApiUsuarios.listar()) e checar se já
//    existe alguém com esse email (comparar em minúsculo)
//    SE existir: mostrar erro no campo de email e PARAR

// 6. Criar o usuário via ApiUsuarios.criar(), sempre com:
//    - role: "aluno"
//    - ativo: true

// 7. SE der certo:
//    - fechar o modal
//    - preencher o campo de email do login com o email cadastrado
//    - mostrar toast de sucesso avisando que já pode entrar

// ===================================================================
// CÓDIGO (passos 1 a 12 já implementados)
// ===================================================================

// Passo 1
function verificarLoginExistente() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (usuarioLogado) {
        window.location.href = '../HTML/catalogo-cursos.html';
    }
}

verificarLoginExistente();

// Liga o botão de mostrar/ocultar senha (ícones eye/eye-off do Lucide) em
// qualquer campo de senha da página. Por padrão a senha fica oculta.
function configurarToggleSenha() {
    document.querySelectorAll('.btn-alternar-senha').forEach((botao) => {
        botao.addEventListener('click', () => {
            const input = document.querySelector(`#${botao.dataset.input}`);
            const iconeVer = botao.querySelector('.icone-senha-ver');
            const iconeOcultar = botao.querySelector('.icone-senha-ocultar');

            const senhaEstaVisivel = input.type === 'text';

            input.type = senhaEstaVisivel ? 'password' : 'text';
            iconeVer.classList.toggle('oculto', senhaEstaVisivel);
            iconeOcultar.classList.toggle('oculto', !senhaEstaVisivel);
            botao.setAttribute('aria-label', senhaEstaVisivel ? 'Mostrar senha' : 'Ocultar senha');
        });
    });
}

// Busca os números reais da plataforma pra vitrine (nada de valor fixo no HTML)
async function carregarEstatisticasVitrine() {
    const [cursos, categorias, usuarios] = await Promise.all([
        ApiCursos.listar(),
        ApiCategorias.listar(),
        ApiUsuarios.listar(),
    ]);

    if (!cursos || !categorias || !usuarios) return;

    const totalCursosPublicados = cursos.filter((curso) => curso.status === 'publicado').length;
    const totalAlunosAtivos = usuarios.filter((usuario) => usuario.role === 'aluno' && usuario.ativo).length;

    document.querySelector('#statCursosPublicados').textContent = totalCursosPublicados;
    document.querySelector('#statCategorias').textContent = categorias.length;
    document.querySelector('#statAlunosAtivos').textContent = totalAlunosAtivos;
}

document.addEventListener('DOMContentLoaded', () => {

    configurarToggleSenha();
    carregarEstatisticasVitrine();

    // Passo 2
    const formLogin = document.querySelector('#formLogin');
    const emailLogin = document.querySelector('#emailLogin');
    const senhaLogin = document.querySelector('#senhaLogin');
    const erroEmailLogin = document.querySelector('#erroEmailLogin');
    const erroSenhaLogin = document.querySelector('#erroSenhaLogin');

    // Some a mensagem de erro de um campo e tira a borda vermelha
    function limparErro(input, spanErro) {
        input.classList.remove('erro');
        spanErro.classList.remove('visivel');
    }

    // Mostra a mensagem de erro de um campo e coloca a borda vermelha
    function mostrarErro(input, spanErro) {
        input.classList.add('erro');
        spanErro.classList.add('visivel');
    }

    // Passo 3
    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();

        const cpEmailLogin = emailLogin.value.trim();
        const cpSenhaLogin = senhaLogin.value;

        // Começa limpando os erros da tentativa anterior
        limparErro(emailLogin, erroEmailLogin);
        limparErro(senhaLogin, erroSenhaLogin);

        // Passo 4
        let formularioValido = true;

        if (!Utils.Texto.ehEmailValido(cpEmailLogin)) {
            mostrarErro(emailLogin, erroEmailLogin);
            formularioValido = false;
        }

        if (!Utils.Texto.naoVazio(cpSenhaLogin) || !Utils.Texto.tamanhoValido(cpSenhaLogin, 6, 100)) {
            mostrarErro(senhaLogin, erroSenhaLogin);
            formularioValido = false;
        }

        if (!formularioValido) {
            return;
        }

        const btnEntrar = document.querySelector('#btnEntrar');

        // Passo 12: desabilita o botão enquanto a requisição está rodando
        btnEntrar.disabled = true;
        btnEntrar.textContent = 'Entrando...';

        // Passo 5
        const listaUsuarios = await ApiUsuarios.listar();

        if (!listaUsuarios) {
            erroEmailLogin.textContent = 'Não foi possível conectar ao servidor. Tente novamente.';
            mostrarErro(emailLogin, erroEmailLogin);
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar';
            return;
        }

        // Passo 6
        const usuarioEncontrado = listaUsuarios.find((usuario) => {
            return usuario.email.toLowerCase() === cpEmailLogin.toLowerCase();
        });

        // Passo 7
        if (!usuarioEncontrado) {
            erroEmailLogin.textContent = 'Email não encontrado.';
            mostrarErro(emailLogin, erroEmailLogin);
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar';
            return;
        }

        // Passo 8
        if (usuarioEncontrado.senha !== cpSenhaLogin) {
            erroSenhaLogin.textContent = 'Senha incorreta.';
            mostrarErro(senhaLogin, erroSenhaLogin);
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar';
            return;
        }

        // Passo 9
        if (!usuarioEncontrado.ativo) {
            erroEmailLogin.textContent = 'Esta conta está desativada. Fale com um administrador.';
            mostrarErro(emailLogin, erroEmailLogin);
            btnEntrar.disabled = false;
            btnEntrar.textContent = 'Entrar';
            return;
        }

        // Passo 10
        const usuarioLogado = {
            id: usuarioEncontrado.id,
            nome: usuarioEncontrado.nome,
            email: usuarioEncontrado.email,
            role: usuarioEncontrado.role
        };

        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

        // Passo 11
        window.location.href = '../HTML/catalogo-cursos.html';
    });

    // ===================================================================
    // CADASTRO (modal "Criar conta")
    // ===================================================================

    // Passo 2
    const modalCadastro = document.querySelector('#modalCadastro');
    const nomeCadastro = document.querySelector('#nomeCadastro');
    const emailCadastro = document.querySelector('#emailCadastro');
    const senhaCadastro = document.querySelector('#senhaCadastro');
    const confirmarSenhaCadastro = document.querySelector('#confirmarSenhaCadastro');
    const termosCadastro = document.querySelector('#termosCadastro');
    const forcaSenhaCadastro = document.querySelector('#forcaSenhaCadastro');

    const erroNomeCadastro = document.querySelector('#erroNomeCadastro');
    const erroEmailCadastro = document.querySelector('#erroEmailCadastro');
    const erroSenhaCadastro = document.querySelector('#erroSenhaCadastro');
    const erroConfirmarSenhaCadastro = document.querySelector('#erroConfirmarSenhaCadastro');
    const erroTermosCadastro = document.querySelector('#erroTermosCadastro');

    // Passo 1
    function abrirModalCadastro() {
        modalCadastro.classList.add('aberto');
        animacoes.animarModalAbrir(modalCadastro.querySelector('.modal'));
    }

    function fecharModalCadastro() {
        const resultado = animacoes.animarModalFechar(modalCadastro.querySelector('.modal'));
        Promise.resolve(resultado).then(() => modalCadastro.classList.remove('aberto'));
    }

    function limparFormularioCadastro() {
        document.querySelector('#formCadastro').reset();
        forcaSenhaCadastro.className = 'login-forca-senha';

        [nomeCadastro, emailCadastro, senhaCadastro, confirmarSenhaCadastro].forEach((campo) => campo.classList.remove('erro'));
        [erroNomeCadastro, erroEmailCadastro, erroSenhaCadastro, erroConfirmarSenhaCadastro, erroTermosCadastro].forEach((span) => span.classList.remove('visivel'));
    }

    document.querySelector('#btnAbrirCadastro').addEventListener('click', abrirModalCadastro);
    document.querySelector('#btnFecharModalCadastro').addEventListener('click', fecharModalCadastro);
    document.querySelector('#btnCancelarCadastro').addEventListener('click', fecharModalCadastro);
    modalCadastro.addEventListener('click', (event) => {
        if (event.target === modalCadastro) fecharModalCadastro();
    });

    // Barra de força da senha: atualiza a cada letra digitada
    senhaCadastro.addEventListener('input', () => {
        const tamanho = senhaCadastro.value.length;

        if (tamanho === 0) {
            forcaSenhaCadastro.className = 'login-forca-senha';
        } else if (tamanho < 6) {
            forcaSenhaCadastro.className = 'login-forca-senha fraca';
        } else if (tamanho < 12) {
            forcaSenhaCadastro.className = 'login-forca-senha media';
        } else {
            forcaSenhaCadastro.className = 'login-forca-senha forte';
        }
    });

    // Monta os dados do "primeiro curso" pra mostrar no email, a partir do
    // catálogo real (em vez de um curso fixo), com um texto genérico se não
    // achar nenhum curso publicado.
    async function montarPrimeiroCursoParaEmail() {
        const cursos = await ApiCursos.listar();
        const cursosPublicados = (cursos || []).filter((curso) => curso.status === 'publicado');

        const primeiroCurso = cursosPublicados.find((curso) => curso.nivel === 'Iniciante') || cursosPublicados[0];

        if (!primeiroCurso) {
            return { nomeCurso: 'Nossos cursos de games', nomeInstrutor: 'Equipe da Game Academy' };
        }

        const instrutor = await ApiUsuarios.buscarPorId(primeiroCurso.instrutorId);

        return {
            nomeCurso: primeiroCurso.titulo,
            nomeInstrutor: instrutor ? instrutor.nome : 'Equipe da Game Academy',
        };
    }

    // Envia o email de boas-vindas via EmailJS. Se falhar, não impede o
    // cadastro (a conta já foi criada) — só avisa o usuário sobre isso.
    async function enviarEmailConfirmacao(usuario) {
        if (typeof emailjs === 'undefined') {
            console.warn('EmailJS não foi carregado.');
            return false;
        }

        try {
            const { nomeCurso, nomeInstrutor } = await montarPrimeiroCursoParaEmail();

            await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, {
                to_email: usuario.email,
                nomeAluno: usuario.nome,
                nomeCurso,
                nomeInstrutor,
            });

            return true;
        } catch (erro) {
            console.error('Falha ao enviar email de confirmação:', erro);
            return false;
        }
    }

    // Passo 3
    document.querySelector('#btnCriarConta').addEventListener('click', async () => {
        const nome = nomeCadastro.value.trim();
        const email = emailCadastro.value.trim();
        const senha = senhaCadastro.value;
        const confirmarSenha = confirmarSenhaCadastro.value;

        // Passo 4
        let cadastroValido = true;

        if (!Utils.Texto.tamanhoValido(nome, 3, 100)) {
            mostrarErro(nomeCadastro, erroNomeCadastro);
            cadastroValido = false;
        } else {
            limparErro(nomeCadastro, erroNomeCadastro);
        }

        if (!Utils.Texto.ehEmailValido(email)) {
            mostrarErro(emailCadastro, erroEmailCadastro);
            cadastroValido = false;
        } else {
            limparErro(emailCadastro, erroEmailCadastro);
        }

        if (!Utils.Texto.tamanhoValido(senha, 6, 50)) {
            mostrarErro(senhaCadastro, erroSenhaCadastro);
            cadastroValido = false;
        } else {
            limparErro(senhaCadastro, erroSenhaCadastro);
        }

        if (confirmarSenha !== senha || !Utils.Texto.naoVazio(confirmarSenha)) {
            mostrarErro(confirmarSenhaCadastro, erroConfirmarSenhaCadastro);
            cadastroValido = false;
        } else {
            limparErro(confirmarSenhaCadastro, erroConfirmarSenhaCadastro);
        }

        if (!termosCadastro.checked) {
            erroTermosCadastro.classList.add('visivel');
            cadastroValido = false;
        } else {
            erroTermosCadastro.classList.remove('visivel');
        }

        if (!cadastroValido) return;

        const btnCriarConta = document.querySelector('#btnCriarConta');
        btnCriarConta.disabled = true;
        btnCriarConta.textContent = 'Criando conta...';

        // Passo 5
        const usuariosExistentes = await ApiUsuarios.listar();

        if (!usuariosExistentes) {
            animacoes.mostrarToast('erro', 'Erro ao cadastrar', 'Não foi possível conectar ao servidor. Tente novamente.');
            btnCriarConta.disabled = false;
            btnCriarConta.textContent = 'Criar conta';
            return;
        }

        const emailJaExiste = usuariosExistentes.some((usuarioExistente) => {
            return usuarioExistente.email.toLowerCase() === email.toLowerCase();
        });

        if (emailJaExiste) {
            erroEmailCadastro.textContent = 'Este email já está cadastrado.';
            mostrarErro(emailCadastro, erroEmailCadastro);
            btnCriarConta.disabled = false;
            btnCriarConta.textContent = 'Criar conta';
            return;
        }

        // Passo 6: todo cadastro feito por aqui entra como aluno, já ativo
        const novoUsuario = await ApiUsuarios.criar({
            nome,
            email,
            senha,
            role: 'aluno',
            ativo: true,
        });

        if (!novoUsuario) {
            animacoes.mostrarToast('erro', 'Falha ao cadastrar', 'Tente novamente em instantes.');
            btnCriarConta.disabled = false;
            btnCriarConta.textContent = 'Criar conta';
            return;
        }

        // Passo 7: a conta já foi criada; o email é só um "bônus" — se falhar,
        // avisamos, mas o cadastro continua valendo normalmente
        btnCriarConta.textContent = 'Enviando email...';
        const emailEnviado = await enviarEmailConfirmacao(novoUsuario);

        btnCriarConta.disabled = false;
        btnCriarConta.textContent = 'Criar conta';
        fecharModalCadastro();
        limparFormularioCadastro();

        emailLogin.value = email;

        if (emailEnviado) {
            animacoes.mostrarToast('sucesso', 'Conta criada com sucesso', 'Enviamos um email de boas-vindas. Você já pode entrar com seu email e senha.');
        } else {
            animacoes.mostrarToast('sucesso', 'Conta criada com sucesso', 'Não conseguimos enviar o email de boas-vindas, mas você já pode entrar com seu email e senha.');
        }
    });

});
