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

document.addEventListener('DOMContentLoaded', () => {

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

});
