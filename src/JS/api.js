/**
 * api.js — Requisições HTTP para o json-server.
 * Concentra toda a comunicação com o "banco de dados" (GET, POST, PUT, DELETE).
 */

const URL_BASE = 'http://localhost:3000';

// Faz a requisição de verdade e já trata erro de rede/resposta ruim
async function fazerRequisicao(caminho, opcoes = {}) {
    try {
        const resposta = await fetch(`${URL_BASE}${caminho}`, opcoes);

        if (!resposta.ok) {
            throw new Error(`Erro na requisição: ${resposta.status}`);
        }

        // DELETE geralmente não devolve corpo, então não tentamos ler JSON nesse caso
        if (opcoes.method === 'DELETE') {
            return true;
        }

        return await resposta.json();
    } catch (erro) {
        console.error('Falha ao comunicar com o servidor:', erro);
        return null;
    }
}

// Gera os 4 métodos (listar, criar, atualizar, excluir) para um recurso do json-server
function criarServicoRecurso(nomeRecurso) {
    return {
        listar() {
            return fazerRequisicao(`/${nomeRecurso}`, {
                method: 'GET'
            });
        },

        buscarPorId(id) {
            return fazerRequisicao(`/${nomeRecurso}/${id}`, {
                method: 'GET'
            });
        },

        criar(dados) {
            return fazerRequisicao(`/${nomeRecurso}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        },

        atualizar(id, dados) {
            return fazerRequisicao(`/${nomeRecurso}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
        },

        excluir(id) {
            return fazerRequisicao(`/${nomeRecurso}/${id}`, {
                method: 'DELETE'
            });
        }
    };
}

// Um serviço pronto para cada um dos 6 endpoints do dbCursos.json
const ApiUsuarios = criarServicoRecurso('usuarios');
const ApiCategorias = criarServicoRecurso('categorias');
const ApiCursos = criarServicoRecurso('cursos');
const ApiAulas = criarServicoRecurso('aulas');
const ApiMatriculas = criarServicoRecurso('matriculas');
const ApiAvaliacoes = criarServicoRecurso('avaliacoes');
