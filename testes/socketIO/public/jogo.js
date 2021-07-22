var socket = io('http://localhost:3000');
var idSocket = ""

var usuario = {}
var nome = ""
var sala = ""
var primeiro = false
var lista_usuarios = {}

// Início da conexão e enviando pedido autenticação
socket.on('connect', function(){ 
    nome = window.prompt('Qual o seu nome?');
    sala = window.prompt('Qual a sala?');
    var a = "entrar:"+nome+":"+sala
    socket.emit('autenticacaoServidor', a)
})

// Recebendo resposta de autenticação
socket.on('autenticacaoCliente', data => {
    var user = JSON.parse(data)
    if (user.codigo=="200") {
        usuario = user

        // Não é o primeiro usuário
        if (usuario.posicao!=1) {
            var idSocketPrimeiro = 0
            console.log(lista_usuarios)
            // Pocurando o primeiro candidato
            lista_usuarios.forEach((p) => {
                if (p.posicao==1) {
                    idSocketPrimeiro = p.idSocket
                }    
            })

            navigator.mediaDevices
                .getUserMedia({ video: false, audio: true })
                .then((stream) => {
                midias = stream;
                localConnection = new RTCPeerConnection(ice_servers);
                midias
                    .getTracks()
                    .forEach((track) => localConnection.addTrack(track, midias));
                localConnection.onicecandidate = ({ candidate }) => {
                    candidate &&
                    socket.emit("candidate", idSocketPrimeiro, candidate);
                };
                console.log("teste")
                console.log(midias);
                localConnection.ontrack = ({ streams: [midias] }) => {
                    audio.srcObject = midias;
                };
                localConnection
                    .createOffer()
                    .then((offer) => localConnection.setLocalDescription(offer))
                    .then(() => {
                    socket.emit(
                        "offer",
                        jogadores.primeiro,
                        localConnection.localDescription
                    );
                    });
                })
                .catch((error) => console.log(error));
        }


    } else {
        console.log(user.codigo)
        socket.disconnect()
    }
})

// Recebendo lista de jogadores ativos
socket.on('atualizarUsers', data => {
    var i = 0
    lista_usuarios = data
    $('#users').empty().trigger("change");
    data.forEach((jogador) => {
        if (jogador.nome!=nome) {
            $('#users').append(new Option(jogador.nome, i));
            i++;
        }    
    })
})

// Recebendo resposta de desconexão
socket.on('disconnectCliente', data => {
    console.log(data)
    socket.disconnect()
})

// Processo offer SDP
this.socket.on("offer", (socketId, description) => {
    remoteConnection = new RTCPeerConnection(ice_servers);
    midias
      .getTracks()
      .forEach((track) => remoteConnection.addTrack(track, midias));
    remoteConnection.onicecandidate = ({ candidate }) => {
      candidate && socket.emit("candidate", socketId, candidate);
    };
    remoteConnection.ontrack = ({ streams: [midias] }) => {
      audio.srcObject = midias;
    };
    remoteConnection
      .setRemoteDescription(description)
      .then(() => remoteConnection.createAnswer())
      .then((answer) => remoteConnection.setLocalDescription(answer))
      .then(() => {
        socket.emit("answer", socketId, remoteConnection.localDescription);
      });
});

// Processo answer SDP  
socket.on("answer", (description) => {
    localConnection.setRemoteDescription(description);
});

// Processo candidate SDP  
socket.on("candidate", (candidate) => {
    const conn = localConnection || remoteConnection;
    conn.addIceCandidate(new RTCIceCandidate(candidate));
});

var cenario = window.document.getElementById('cenario');
var ctx = cenario.getContext('2d');
window.document.addEventListener("keydown", movimentar);

setInterval(jogo,130); // Tempo para chamar a função

const vel = 1;
var tam_peca = 20; 
var qtd_peca = 30;
var vx = vy = 0;
var px = py = 200; // Cabeça da cobra
var fx = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição x da fruta
var fy = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição y da fruta
var pontos = 0
var cor = true

function jogo(){
        
    px += vx;
    py += vy;

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
    ctx.fillRect(0,0, cenario.width, cenario.height);

    // Fruta
    ctx.fillStyle = "green"; 
    ctx.fillRect(fx*tam_peca,fy*tam_peca, tam_peca, tam_peca);

    // Jogador
    if (cor) {
        ctx.fillStyle = "red"
    } else {
        ctx.fillStyle = "#FE7777"
    }
    ctx.fillRect(px*tam_peca, py*tam_peca, tam_peca, tam_peca);
    cor = !cor
     
    // Reposicionando fruta e somando ponto
    if(fx == px && fy == py){
        fx = Math.floor(Math.random() * (qtd_peca - 1)) + 1; 
        fy = Math.floor(Math.random() * (qtd_peca - 1)) + 1; 
        pontos++
    }

}

function movimentar(event){

    switch (event.keyCode){
        case 37: // Esquerda
            vx = -vel;
            vy = 0;
            break;
        case 39: // Direita
            vx = vel;
            vy = 0;
            break;
        case 38: // Cima
            vx = 0;
            vy = -vel;
            break;
        case 40: // Baixo
            vx = 0;
            vy = vel;
            break;
        case 83: // Stop
            vx = vy = 0;
            break;
        default:
            break;
    }

}

