var socket = io('http://localhost:3000');
var idSocket = ""

var usuario = {}
var nome = ""
var sala = ""
var salas = {}
var fx = fy = 0
var primeiro = false
var lista_usuarios = {}
var ice_servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
var localConnection;
var remoteConnection;
var midias;

// Início da conexão e enviando pedido autenticação
socket.on('connect', function () {
    //nome = window.prompt('Qual o seu nome?');
    //sala = window.prompt('Qual a sala?');
    //var a = "entrar:" + nome + ":" + sala
    //socket.emit('autenticacaoServidor', a)
})

// Rebendo salas disponíveis
socket.on('salasDisponiveis', data => {
    var salasJSON = JSON.parse(data)
    salas = salasJSON
    for (let i = 0; i < salas.length; i++) {
        if (salas[i].nome == sala) {
            fx = salas[i].fx
            fy = salas[i].fy
        }
    }
    nome = window.prompt('Qual o seu nome?');
    sala = window.prompt('Salas disponíveis:\n'+'Nome: '+salasJSON[0].nome+', Jogadores: '+salasJSON[0].qtd+'/'+salasJSON[0].max
                        +'\nNome: '+salasJSON[1].nome+', Jogadores: '+salasJSON[1].qtd+'/'+salasJSON[1].max
                        +'\nNome: '+salasJSON[2].nome+', Jogadores: '+salasJSON[2].qtd+'/'+salasJSON[2].max
                        +'\n\n Escolha sua sala digitando o nome dela:\n\n');
    var a = "entrar:" + nome + ":" + sala
    socket.emit('autenticacaoServidor', a)
})

// Recebendo resposta de autenticação
socket.on('autenticacaoCliente', data => {
    var user = JSON.parse(data)
    if (user.codigo == "200") {
        usuario = user

        navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
          midias = stream;
        })
        .catch((error) => console.log(error));

        // Não é o primeiro usuário
        if (usuario.posicao != 1) {
            var idSocketPrimeiro = 0
            
            // Pocurando o primeiro candidato
            lista_usuarios.forEach((p) => {
                if (p.posicao == 1) {
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
                                idSocketPrimeiro,
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
    
    lista_usuarios = data
    renderizaPlacar(data)
    /*
    $('#users').empty().trigger("change");
    data.forEach((jogador) => {
        if (jogador.sala == sala) {
            if (jogador.nome != nome) {
                $('#users').append(new Option(jogador.nome+": "+jogador.pontuacao, i));
                i++;
            } else {
                $('#users').append(new Option("você: "+jogador.pontuacao, i));
                i++;
            }
        }
    })*/
})

// Renderiza o placar
function renderizaPlacar(data) {
    console.log("teste")
    var i = 0
    $('#users').empty().trigger("change");
    data.forEach((jogador) => {
        if (jogador.sala == sala) {
            if (jogador.nome != nome) {
                $('#users').append(new Option(jogador.nome+": "+jogador.pontuacao, i));
                i++;
            } else {
                $('#users').append(new Option("você: "+jogador.pontuacao, i));
                i++;
            }
        }
    })
    return true
}

// Recebendo resposta de desconexão
socket.on('disconnectCliente', data => {
    console.log(data)
    socket.disconnect()
})

// Processo offer SDP
socket.on("offer", (socketId, description) => {
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

// Envia nova posição para os outros jogadores da sala
function enviaNovaPosicao() {
    // enviar meu objeto jogador com a nova posição
    socket.emit('repassaNovaPosicaoServidor', JSON.stringify(usuario))
}

// Recebe posição de algum jogador da sala
socket.on('posicaoOutroJogador', data => {
    var j = JSON.parse(data)
    for (let i = 0; i < lista_usuarios.length; i++) {
        if (lista_usuarios[i].sala == j.sala) {
            if (lista_usuarios[i].nome == j.nome) {
                lista_usuarios[i].px = j.px
                lista_usuarios[i].py = j.py
            }
        }
    }
})

// Reposiciona fruta
socket.on('novaPosicaoFruta', data =>{
    salas = JSON.parse(data)
    for (let i = 0; i < salas.length; i++) {
        if (salas[i].nome == sala) {
            fx = salas[i].fx
            fy = salas[i].fy
        }
    }
})

/*------------------- LÓGICA DO JOGO -------------------*/ 
const vel = 1;
var tam_peca = 20;
var qtd_peca = 30;
var pontos = 0
var cor = true

var cenario = window.document.getElementById('cenario');
var ctx = cenario.getContext('2d');
window.document.addEventListener("keydown", movimentar);

setInterval(jogo, 200); // Tempo para chamar a função

function jogo() {
    
    //console.log("EU:", usuario.px,usuario.py)

    if (usuario.px<0){ // Chegou no lado esquerdo
        usuario.px = qtd_peca - 1;
    }
    if (usuario.px > qtd_peca - 1){ // Chegou no lado direito
        usuario.px = 0;
    }
    if (usuario.py < 0){ // Chegou em cima
        usuario.py = qtd_peca - 1;
    }
    if (usuario.py > qtd_peca -1){ // Chegou embaixo
        usuario.py = 0;
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
    ctx.fillRect(usuario.px * tam_peca, usuario.py * tam_peca, tam_peca, tam_peca);
    cor = !cor

    // Desenha outros jogadores
    for (let i = 0; i < lista_usuarios.length; i++) {
        if (lista_usuarios[i].sala == usuario.sala) {
            if (lista_usuarios[i].nome != usuario.nome) { 
                ctx.fillStyle = "yellow"
                ctx.fillRect(lista_usuarios[i].px * tam_peca, lista_usuarios[i].py * tam_peca, tam_peca, tam_peca);
                //console.log("entrei3",lista_usuarios[i].px,lista_usuarios[i].py)
            }
        }
    } 
    
    // Reposicionando fruta e somando ponto
    if (fx == usuario.px && fy == usuario.py) {
        console.log("fruta")
        socket.emit('repassaNovaPosicaoServidor', JSON.stringify(usuario))
        socket.emit("reposicionaFruta", JSON.stringify(usuario))
    }

}

function movimentar(event) {

    switch (event.keyCode) {
        case 37: // Esquerda
            usuario.px += -vel
            usuario.py += 0
            //enviaNovaPosicao(usuario.px,usuario.py)
            socket.emit('repassaNovaPosicaoServidor', JSON.stringify(usuario))
            break;
        case 39: // Direita
            usuario.px += vel
            usuario.py += 0
            //enviaNovaPosicao(usuario.px,usuario.py)
            socket.emit('repassaNovaPosicaoServidor', JSON.stringify(usuario))
            break;
        case 38: // Cima
            usuario.px += 0
            usuario.py += -vel
            //enviaNovaPosicao(usuario.px,usuario.py)
            socket.emit('repassaNovaPosicaoServidor', JSON.stringify(usuario))
            break;
        case 40: // Baixo
            usuario.px += 0
            usuario.py += vel
            //enviaNovaPosicao(usuario.px,usuario.py)
            socket.emit('repassaNovaPosicaoServidor', JSON.stringify(usuario))
            break;
        default:
            break;
    }

}


