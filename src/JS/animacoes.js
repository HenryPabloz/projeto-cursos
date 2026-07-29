/**
 * animacoes.js — Funções de animação reutilizáveis (GSAP + Lenis).
 * Cuida apenas da parte visual/motion da interface — nenhuma lógica de
 * negócio (login, CRUD, roles) vive aqui.
 */

const prefereReduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Inicializa o smooth scroll (Lenis) e conecta com o ScrollTrigger do GSAP
function inicializarLenis() {
  if (prefereReduzirMovimento || typeof Lenis === 'undefined') return null;

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  // Modais têm sua própria rolagem interna (overflow-y: auto). Sem isso, o Lenis
  // "sequestra" a roda do mouse para rolar a página inteira por baixo do modal,
  // e o scroll dele só respondia arrastando a barra de rolagem manualmente.
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.setAttribute('data-lenis-prevent', '');
  });

  // Loop próprio do Lenis: garante que o scroll seja atualizado a cada quadro,
  // mesmo que o GSAP demore para carregar ou não esteja disponível
  function loopDeScroll(tempoAtual) {
    lenis.raf(tempoAtual);
    requestAnimationFrame(loopDeScroll);
  }
  requestAnimationFrame(loopDeScroll);

  if (typeof gsap !== 'undefined') {
    // Evita que o GSAP tente "compensar" quadros perdidos — isso é o que
    // causava o atraso perceptível no scroll ao usar junto com o Lenis
    gsap.ticker.lagSmoothing(0);

    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
    }
  }

  return lenis;
}

// Controla se a navbar/sidebar já animaram, para nunca rodar de novo
// (isso evita a navbar ficar "presa" em opacidade baixa quando a tela
// re-renderiza uma lista várias vezes, por exemplo a cada letra digitada)
let cabecalhoJaAnimou = false;

// Anima a entrada da página: navbar/sidebar deslizam (uma única vez),
// cards aparecem em sequência (pode ser chamada de novo a cada re-render)
function animarEntradaPagina() {
  if (prefereReduzirMovimento || typeof gsap === 'undefined') return;

  if (!cabecalhoJaAnimou) {
    gsap.set('.navbar, .sidebar', { clearProps: 'all' });
    gsap.from('.navbar, .sidebar', { opacity: 0, y: -20, duration: 0.6, ease: 'power2.out' });
    cabecalhoJaAnimou = true;
  }

  gsap.set('.card', { clearProps: 'all' });
  gsap.from('.card', {
    opacity: 0,
    y: 20,
    duration: 0.5,
    stagger: 0.08,
    ease: 'power2.out',
  });
}

// Cards que aparecem enquanto o usuário rola a página (catálogo, aulas, avaliações)
function animarCardsScroll(seletor = '.card') {
  if (prefereReduzirMovimento || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.utils.toArray(seletor).forEach((elemento) => {
    gsap.from(elemento, {
      scrollTrigger: {
        trigger: elemento,
        start: 'top 85%',
      },
      opacity: 0,
      y: 24,
      duration: 0.6,
      ease: 'power2.out',
    });
  });
}

// Reforça o hover dos cards com leve elevação (o CSS já cobre a base do efeito)
function animarHoverCard() {
  if (prefereReduzirMovimento || typeof gsap === 'undefined') return;

  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, { y: -6, duration: 0.2, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { y: 0, duration: 0.2, ease: 'power2.out' });
    });
  });
}

// Abre um modal com um leve "pop" (scale + fade)
function animarModalAbrir(modalElement) {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo(
    modalElement,
    { scale: 0.94, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
  );
}

// Fecha um modal com fade + leve encolhimento
function animarModalFechar(modalElement) {
  if (typeof gsap === 'undefined') return Promise.resolve();
  return gsap.to(modalElement, { scale: 0.94, opacity: 0, duration: 0.2, ease: 'power1.in' });
}

// Anima o preenchimento de uma barra de progresso até o percentual informado
function animarBarraProgresso(seletor, percentual) {
  if (typeof gsap === 'undefined') {
    document.querySelectorAll(seletor).forEach((el) => (el.style.width = `${percentual}%`));
    return;
  }
  gsap.to(seletor, { width: `${percentual}%`, duration: 0.8, ease: 'power2.out' });
}

// Preenche o anel de progresso (conic-gradient) até o percentual final, animando a variável --progresso
function animarAnelProgresso(elemento, percentualFinal) {
  const valores = { progresso: 0 };
  const rotulo = elemento.querySelector('.anel-progresso-valor');

  if (typeof gsap === 'undefined') {
    elemento.style.setProperty('--progresso', percentualFinal);
    if (rotulo) rotulo.textContent = `${percentualFinal}%`;
    return;
  }

  gsap.to(valores, {
    progresso: percentualFinal,
    duration: 1,
    ease: 'power2.out',
    onUpdate() {
      const atual = Math.round(valores.progresso);
      elemento.style.setProperty('--progresso', atual);
      if (rotulo) rotulo.textContent = `${atual}%`;
    },
  });
}

// Mario correndo de um lado ao outro da faixa (.mario-runner-container), em loop
// infinito. A velocidade e o comportamento variam com o nível de dificuldade
// do curso: cursos avançados têm o Mario mais rápido e mudando de direção.
function animarMarioRunner(nivel) {
  const container = document.querySelector('.mario-runner-container');
  const mario = document.querySelector('.mario-sprite');
  if (!container || !mario) return;

  if (prefereReduzirMovimento || typeof gsap === 'undefined') {
    gsap && gsap.set(mario, { x: 0, opacity: 1 });
    return;
  }

  const configuracaoPorNivel = {
    'Iniciante': { duracaoCorrida: 12, intervaloEntreCorridas: 5, mudaDirecao: false },
    'Mediano': { duracaoCorrida: 8, intervaloEntreCorridas: 4, mudaDirecao: false },
    'Avançado': { duracaoCorrida: 5, intervaloEntreCorridas: 3, mudaDirecao: true },
  };
  const configuracao = configuracaoPorNivel[nivel] || configuracaoPorNivel['Mediano'];

  const larguraSprite = mario.offsetWidth;
  const larguraContainer = container.offsetWidth;

  gsap.set(mario, { x: -larguraSprite, opacity: 0, scaleX: 1 });

  const timeline = gsap.timeline({ repeat: -1, repeatDelay: configuracao.intervaloEntreCorridas });

  timeline
    .to(mario, { opacity: 1, duration: 0.3 })
    .to(mario, { x: larguraContainer + larguraSprite, duration: configuracao.duracaoCorrida, ease: 'linear' }, 0.1);

  if (configuracao.mudaDirecao) {
    // No nível avançado, o Mario chega do outro lado, vira de frente e corre de volta
    timeline
      .to(mario, { scaleX: -1, duration: 0.2 })
      .to(mario, { x: -larguraSprite, duration: configuracao.duracaoCorrida, ease: 'linear' })
      .to(mario, { scaleX: 1, duration: 0.2 })
      .to(mario, { opacity: 0, duration: 0.3 });
  } else {
    timeline.to(mario, { opacity: 0, duration: 0.3 }, '-=0.3');
  }
}

// Conta de 0 até o número final (usado em notas médias, totais, etc)
function animarContador(elemento, numeroFinal, duracao = 1) {
  const valores = { numero: 0 };

  if (typeof gsap === 'undefined') {
    elemento.textContent = numeroFinal;
    return;
  }

  gsap.to(valores, {
    numero: numeroFinal,
    duration: duracao,
    ease: 'power1.out',
    onUpdate() {
      elemento.textContent = Math.floor(valores.numero);
    },
  });
}

// Toast entra deslizando da direita e sai sozinho após o tempo informado
function animarToast(elemento, duracaoVisivel = 4) {
  if (typeof gsap === 'undefined') {
    setTimeout(() => elemento.remove(), duracaoVisivel * 1000);
    return;
  }

  const tl = gsap.timeline({ onComplete: () => elemento.remove() });
  tl.from(elemento, { x: 80, opacity: 0, duration: 0.35, ease: 'back.out(1.7)' })
    .to(elemento, { x: 80, opacity: 0, duration: 0.3, delay: duracaoVisivel, ease: 'power1.in' });
}

const ICONE_POR_TIPO_TOAST = {
  sucesso: '✓',
  erro: '✗',
  aviso: '!',
  info: 'ℹ',
};

// Cria e mostra um toast dentro de #toastContainer (precisa existir na página)
function mostrarToast(tipo, titulo, mensagem, duracaoVisivel = 4) {
  const container = document.querySelector('#toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    <span class="toast-icone">${ICONE_POR_TIPO_TOAST[tipo] || 'ℹ'}</span>
    <div class="toast-corpo">
      <p class="toast-titulo">${titulo}</p>
      <p class="toast-mensagem">${mensagem}</p>
    </div>
    <button type="button" class="toast-fechar" aria-label="Fechar notificação">✕</button>
  `;

  container.appendChild(toast);

  toast.querySelector('.toast-fechar').addEventListener('click', () => toast.remove());

  animarToast(toast, duracaoVisivel);
}

window.animacoes = {
  inicializarLenis,
  animarEntradaPagina,
  animarCardsScroll,
  animarHoverCard,
  animarModalAbrir,
  animarModalFechar,
  animarBarraProgresso,
  animarAnelProgresso,
  animarMarioRunner,
  animarContador,
  animarToast,
  mostrarToast,
};
