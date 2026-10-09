// Recomendação do quiz "Qual plano é o seu?".
// Funciona no navegador (window.SpeedPlans) e no node (tests/plan-logic.test.js).
(function (root) {
  const PLANS = {
    f500:  { name: 'Fibra 500 MEGA',  price: '104,99' },
    f700:  { name: 'Fibra 700 MEGA',  price: '114,99' },
    f800:  { name: 'Fibra 800 MEGA',  price: '124,99' },
    f1000: { name: 'Fibra 1000 MEGA', price: '154,99' },
    g750:  { name: 'Gamer 750 MEGA',  price: '129,99' },
    g1000: { name: 'Gamer 1000 MEGA', price: '159,99' },
    c500:  { name: 'Combo 500 MEGA + TV',  price: '139,99' },
    c700:  { name: 'Combo 700 MEGA + TV',  price: '154,99' },
    c1000: { name: 'Combo 1000 MEGA + TV', price: '179,99' },
  };

  // people: 2 (1-2), 4 (3-4) ou 5 (5+). uses: '4k' | 'office' | 'games' | 'devices'.
  function recommend({ people, uses = [], tv = false }) {
    const gamer = uses.includes('games');
    let key, why;

    if (tv) {
      key = people >= 5 || gamer ? 'c1000' : people >= 3 ? 'c700' : 'c500';
      why = 'Internet e TV ao vivo na mesma conta, com Premiere, SporTV, ESPN e Telecine.';
    } else if (gamer) {
      key = people >= 5 ? 'g1000' : 'g750';
      why = 'ExitLag incluso e até 28ms até SP: ping baixo pra jogar sem lag.';
    } else {
      // ponytail: pontuação simples (pessoas + usos pesados); trocar por regra do comercial se eles tiverem uma
      const pts = (people >= 5 ? 3 : people >= 3 ? 2 : 1) + uses.length;
      key = pts <= 2 ? 'f500' : pts === 3 ? 'f700' : pts === 4 ? 'f800' : 'f1000';
      why = {
        f500: 'Dá conta do dia a dia de uma casa pequena, com folga.',
        f700: 'Wi-Fi 6 e 350 Mbps de upload: todo mundo conectado ao mesmo tempo.',
        f800: 'Casa cheia e uso pesado? Sobra velocidade pra todo mundo.',
        f1000: 'O máximo da fibra: 1 Giga pra casa com muita gente e muito aparelho.',
      }[key];
    }
    return { key, ...PLANS[key], why };
  }

  const api = { PLANS, recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SpeedPlans = api;
})(this);
