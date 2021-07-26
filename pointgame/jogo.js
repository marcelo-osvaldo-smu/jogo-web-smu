const vel = 1;
var tam_peca = 20;
var qtd_peca = 30;
var px = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição x do jogador
var py = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição y do jogador
var fx = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição x da fruta
var fy = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição y da fruta
var pontos = 0
var cor = true

var cenario = window.document.getElementById('cenario');
var ctx = cenario.getContext('2d');
window.document.addEventListener("keydown", movimentar);

setInterval(jogo, 130); // Tempo para chamar a função

function jogo() {
    
    if (px<0){ // Chegou no lado esquerdo
        px = qtd_peca - 1;
    }
    if (px > qtd_peca - 1){ // Chegou no lado direito
        px = 0;
    }
    if (py < 0){ // Chegou em cima
        py = qtd_peca - 1;
    }
    if (py > qtd_peca -1){ // Chegou embaixo
        py = 0;
    }

    // Cenário
    ctx.fillStyle = "#C0B9CE";
    ctx.fillRect(0, 0, cenario.width, cenario.height);

    // Fruta
    ctx.fillStyle = "green";
    ctx.fillRect(fx * tam_peca, fy * tam_peca, tam_peca, tam_peca);

    // Jogador
    if (cor) {
        ctx.fillStyle = "red"
    } else {
        ctx.fillStyle = "#FE7777"
    }
    ctx.fillRect(px * tam_peca, py * tam_peca, tam_peca, tam_peca);
    cor = !cor

    // Reposicionando fruta e somando ponto
    if (fx == px && fy == py) {
        fx = Math.floor(Math.random() * (qtd_peca - 1)) + 1;
        fy = Math.floor(Math.random() * (qtd_peca - 1)) + 1;
        pontos++
    }

}

function movimentar(event) {

    switch (event.keyCode) {
        case 37: // Esquerda
            px += -vel
            py += 0
            break;
        case 39: // Direita
            px += vel
            py += 0
            break;
        case 38: // Cima
            px += 0
            py += -vel
            break;
        case 40: // Baixo
            px += 0
            py += vel
            break;
        default:
            break;
    }

}
