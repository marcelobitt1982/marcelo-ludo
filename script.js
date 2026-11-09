let totalJogadores = 4;
let turnoAtual = 0;
let valorDado = 1;
let aguardandoMovimento = false;

const jogadoresConfig = [
    { nome: 'Verde', cor: 'green', ehBot: false, hex: '#00ff66', casaInicial: 0, entradaHome: 50 },
    { nome: 'Vermelho', cor: 'red', ehBot: true, hex: '#ff0055', casaInicial: 13, entradaHome: 11 },
    { nome: 'Amarelo', cor: 'yellow', ehBot: true, hex: '#ffcc00', casaInicial: 26, entradaHome: 24 },
    { nome: 'Magenta', cor: 'magenta', ehBot: true, hex: '#ff00ff', casaInicial: 39, entradaHome: 37 }
];

let jogadoresAtivos = [];
let pecas = {};

const casasSeguras = [2, 11, 15, 24, 28, 37, 41, 50];

// Coordenadas das 52 casas no grid 15x15 alinhadas com ludo.jpg
const trilhaCoordenadas = [
    [2, 7], [3, 7], [4, 7], [5, 7], [6, 7],
    [7, 6], [7, 5], [7, 4], [7, 3], [7, 2], [7, 1],
    [8, 1],
    [9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6],
    [10, 7], [11, 7], [12, 7], [13, 7], [14, 7], [15, 7],
    [15, 8],
    [15, 9], [14, 9], [13, 9], [12, 9], [11, 9], [10, 9],
    [9, 10], [9, 11], [9, 12], [9, 13], [9, 14], [9, 15],
    [8, 15],
    [7, 15], [7, 14], [7, 13], [7, 12], [7, 11], [7, 10],
    [6, 9], [5, 9], [4, 9], [3, 9], [2, 9], [1, 9],
    [1, 8],
    [1, 7]
];

const retasFinais = {
    green:   [[2, 8], [3, 8], [4, 8], [5, 8], [6, 8]],
    red:     [[8, 2], [8, 3], [8, 4], [8, 5], [8, 6]],
    magenta: [[14, 8], [13, 8], [12, 8], [11, 8], [10, 8]],
    yellow:  [[8, 14], [8, 13], [8, 12], [8, 11], [8, 10]]
};

const coordenadasBases = {
    green:   [[3, 3], [4, 3], [3, 4], [4, 4]],
    red:     [[12, 3], [13, 3], [12, 4], [13, 4]],
    yellow:  [[3, 12], [4, 12], [3, 13], [4, 13]],
    magenta: [[12, 12], [13, 12], [12, 13], [13, 13]]
};

// Rotação do Dado 3D conforme o número sorteado
const rotacoesDado = {
    1: 'rotateY(0deg) rotateX(0deg)',
    2: 'rotateY(-90deg) rotateX(0deg)',
    3: 'rotateY(-180deg) rotateX(0deg)',
    4: 'rotateY(90deg) rotateX(0deg)',
    5: 'rotateX(-90deg) rotateY(0deg)',
    6: 'rotateX(90deg) rotateY(0deg)'
};

// Vinculação de eventos de toque e clique ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    const btnRoll = document.getElementById('btn-roll');
    const diceContainer = document.getElementById('dice-container');

    const acaoGirar = (e) => {
        e.preventDefault();
        girarDado();
    };

    btnRoll.addEventListener('click', acaoGirar);
    btnRoll.addEventListener('touchstart', acaoGirar, { passive: false });

    diceContainer.addEventListener('click', acaoGirar);
    diceContainer.addEventListener('touchstart', acaoGirar, { passive: false });
});

function iniciarJogo(num) {
    totalJogadores = num;
    jogadoresAtivos = jogadoresConfig.slice(0, num);
    
    pecas = {};
    jogadoresAtivos.forEach(j => {
        pecas[j.cor] = [-1, -1, -1, -1];
    });

    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'flex';

    gerarGradeTransparente();
    atualizarTabuleiro();
    atualizarUI();
}

function gerarGradeTransparente() {
    const board = document.getElementById('board');
    board.innerHTML = '';

    trilhaCoordenadas.forEach((coord, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.gridColumn = coord[0];
        cell.style.gridRow = coord[1];
        cell.id = `cell-${index}`;
        board.appendChild(cell);
    });

    for (let cor in retasFinais) {
        retasFinais[cor].forEach((coord, idx) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.gridColumn = coord[0];
            cell.style.gridRow = coord[1];
            cell.id = `final-${cor}-${idx}`;
            board.appendChild(cell);
        });
    }

    for (let cor in coordenadasBases) {
        coordenadasBases[cor].forEach((coord, idx) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.style.gridColumn = coord[0];
            cell.style.gridRow = coord[1];
            cell.id = `base-${cor}-${idx}`;
            board.appendChild(cell);
        });
    }
}

function girarDado() {
    if (aguardandoMovimento) return;

    let j = jogadoresAtivos[turnoAtual];
    if (j.ehBot) return; // Impede o jogador de clicar durante a vez do BOT

    const btn = document.getElementById('btn-roll');
    const cube = document.getElementById('dice-cube');
    btn.disabled = true;

    // Efeito de giro 3D
    cube.style.transform = `rotateX(${Math.random() * 720}deg) rotateY(${Math.random() * 720}deg)`;

    setTimeout(() => {
        valorDado = Math.floor(Math.random() * 6) + 1;
        cube.style.transform = rotacoesDado[valorDado];
        processarTurno();
    }, 600);
}

function processarTurno() {
    let j = jogadoresAtivos[turnoAtual];
    let temMovimento = false;

    for (let i = 0; i < 4; i++) {
        let pos = pecas[j.cor][i];
        if (pos === -1 && valorDado === 6) temMovimento = true;
        if (pos !== -1 && pos < 56) temMovimento = true;
    }

    if (!temMovimento) {
        document.getElementById('status-msg').innerText = `${j.nome} sem jogadas válidas. Passando a vez.`;
        setTimeout(proximoTurno, 1500);
        return;
    }

    if (j.ehBot) {
        document.getElementById('status-msg').innerText = `${j.nome} (BOT) jogando...`;
        setTimeout(jogadaBot, 1000);
    } else {
        document.getElementById('status-msg').innerText = 'Sua vez! Clique em um peão para mover.';
        aguardandoMovimento = true;
    }
}

function clicarPeca(cor, index) {
    let j = jogadoresAtivos[turnoAtual];
    if (!aguardandoMovimento || j.cor !== cor) return;

    let pos = pecas[cor][index];

    if (pos === -1) {
        if (valorDado === 6) {
            let config = jogadoresConfig.find(item => item.cor === cor);
            pecas[cor][index] = config.casaInicial;
            verificarCaptura(cor, pecas[cor][index]);
            finalizarJogada(true);
        } else {
            document.getElementById('status-msg').innerText = 'Tire 6 no dado para sair da base!';
        }
        return;
    }

    if (pos !== -1 && pos < 56) {
        let config = jogadoresConfig.find(item => item.cor === cor);
        let novaPos = calcularNovaPosicao(pos, valorDado, config);

        if (novaPos <= 56) {
            pecas[cor][index] = novaPos;
            if (novaPos < 52) {
                verificarCaptura(cor, novaPos);
            }
            finalizarJogada(valorDado === 6);
        } else {
            document.getElementById('status-msg').innerText = 'Número exato no dado necessário para entrar no Home!';
        }
    }
}

function calcularNovaPosicao(atual, dado, config) {
    let pos = atual;
    for (let i = 0; i < dado; i++) {
        if (pos === config.entradaHome) {
            pos = 52;
        } else if (pos >= 52 && pos < 56) {
            pos++;
        } else if (pos === 56) {
            return 56;
        } else {
            pos = (pos + 1) % 52;
        }
    }
    return pos;
}

function verificarCaptura(corAtuante, posicao) {
    let cellIndex = posicao % 52;
    if (casasSeguras.includes(cellIndex)) return;

    for (let outraCor in pecas) {
        if (outraCor === corAtuante) continue;

        pecas[outraCor].forEach((posPeca, idx) => {
            if (posPeca !== -1 && posPeca < 52 && (posPeca % 52) === cellIndex) {
                pecas[outraCor][idx] = -1;
                document.getElementById('status-msg').innerText = `Captura! Peão ${outraCor} voltou para a base!`;
            }
        });
    }
}

function jogadaBot() {
    let j = jogadoresAtivos[turnoAtual];
    let config = jogadoresConfig.find(item => item.cor === j.cor);
    let disponiveis = [];

    for (let i = 0; i < 4; i++) {
        let pos = pecas[j.cor][i];
        if (pos === -1 && valorDado === 6) disponiveis.push(i);
        if (pos !== -1 && pos < 56) {
            let testePos = calcularNovaPosicao(pos, valorDado, config);
            if (testePos <= 56) disponiveis.push(i);
        }
    }

    if (disponiveis.length > 0) {
        let escolha = disponiveis[Math.floor(Math.random() * disponiveis.length)];
        let pos = pecas[j.cor][escolha];

        if (pos === -1) {
            pecas[j.cor][escolha] = config.casaInicial;
            verificarCaptura(j.cor, pecas[j.cor][escolha]);
        } else {
            pecas[j.cor][escolha] = calcularNovaPosicao(pos, valorDado, config);
            if (pecas[j.cor][escolha] < 52) {
                verificarCaptura(j.cor, pecas[j.cor][escolha]);
            }
        }

        finalizarJogada(valorDado === 6);
    } else {
        proximoTurno();
    }
}

function finalizarJogada(jogarNovamente) {
    aguardandoMovimento = false;
    atualizarTabuleiro();

    let j = jogadoresAtivos[turnoAtual];
    let vitoria = pecas[j.cor].every(p => p === 56);
    if (vitoria) {
        document.getElementById('status-msg').innerText = `🏆 ${j.nome.toUpperCase()} VENCEU O JOGO!`;
        document.getElementById('player-name').innerText = 'FIM DE JOGO';
        return;
    }

    if (jogarNovamente) {
        document.getElementById('status-msg').innerText = `${j.nome} tirou 6 e joga de novo!`;
        if (j.ehBot) {
            setTimeout(girarDado, 1200);
        } else {
            document.getElementById('btn-roll').disabled = false;
        }
    } else {
        proximoTurno();
    }
}

function proximoTurno() {
    turnoAtual = (turnoAtual + 1) % jogadoresAtivos.length;
    atualizarUI();

    let j = jogadoresAtivos[turnoAtual];
    if (j.ehBot) {
        document.getElementById('btn-roll').disabled = true;
        setTimeout(girarDado, 1000);
    } else {
        document.getElementById('btn-roll').disabled = false;
        document.getElementById('status-msg').innerText = 'Sua vez de girar o dado!';
    }
}

function atualizarUI() {
    let j = jogadoresAtivos[turnoAtual];
    let span = document.getElementById('player-name');
    span.innerText = j.nome + (j.ehBot ? ' (BOT)' : ' (Você)');
    span.style.color = j.hex;
}

function atualizarTabuleiro() {
    document.querySelectorAll('.pawn').forEach(p => p.remove());
    document.querySelectorAll('.cell-stack').forEach(s => s.remove());

    let mapaCelulas = {};

    for (let cor in pecas) {
        pecas[cor].forEach((pos, index) => {
            let chave;
            if (pos === -1) {
                chave = `base-${cor}-${index}`;
            } else if (pos !== 56) {
                if (pos >= 52) {
                    let idxReta = pos - 52;
                    chave = `final-${cor}-${idxReta}`;
                } else {
                    chave = `cell-${pos % trilhaCoordenadas.length}`;
                }
            }

            if (chave) {
                if (!mapaCelulas[chave]) mapaCelulas[chave] = [];
                mapaCelulas[chave].push({ cor, index });
            }
        });
    }

    for (let chave in mapaCelulas) {
        let cell = document.getElementById(chave);
        if (cell) {
            let stackContainer = document.createElement('div');
            stackContainer.className = 'cell-stack';

            mapaCelulas[chave].forEach(item => {
                const pawn = document.createElement('div');
                pawn.className = `pawn ${item.cor}-pawn`;
                
                // Suporte a toque nas peças para dispositivos móveis
                pawn.addEventListener('click', () => clicarPeca(item.cor, item.index));
                pawn.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    clicarPeca(item.cor, item.index);
                }, { passive: true });

                stackContainer.appendChild(pawn);
            });

            cell.appendChild(stackContainer);
        }
    }
}