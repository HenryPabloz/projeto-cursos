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
    smooth: true,
  });

  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
  }

  return lenis;
}

// Anima a entrada da página: navbar/sidebar deslizam, cards aparecem em sequência
function animarEntradaPagina() {
  if (prefereReduzirMovimento || typeof gsap === 'undefined') return;

  gsap.from('.navbar, .sidebar', { opacity: 0, y: -20, duration: 0.6, ease: 'power2.out' });
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

window.animacoes = {
  inicializarLenis,
  animarEntradaPagina,
  animarCardsScroll,
  animarHoverCard,
  animarModalAbrir,
  animarModalFechar,
  animarBarraProgresso,
  animarAnelProgresso,
  animarContador,
  animarToast,
};
