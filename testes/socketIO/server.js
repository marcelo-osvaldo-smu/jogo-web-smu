const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
//app.set('views', path.join(__dirname, 'public'));
//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');

//app.use('/', (req, res) => {
//    res.send("Hello!")
//})

// Lista de usários ativos por sala
var jogadores_a = []
var jogadores_b = []
var jogadores_c = []

var sockets_a = []
var sockets_b = []
var sockets_c = []

// Lista de todos os usários de todas as salas
var usuarios = []

// Lista de salas disponíveis
var salas = [{ nome: "a", qtd: 0, max: 3 , fx: 50, fy: 50}, { nome: "b", qtd: 0, max: 5, fx: 50, fy: 50 }, { nome: "c", qtd: 0, max: 5, fx: 50, fy: 50 }]

// Quantidade de peça tabuleiro 
var qtd_peca = 30;

io.on('connection', socket => {

    // Enviando informações da sala
    socket.emit('salasDisponiveis',JSON.stringify(salas))

    // Processo de autenticação
    socket.on('autenticacaoServidor', data => {
        var req = data.split(":")
        var nome = req[1]
        var sala = req[2]
        let cliente = {}

        if (verifica_sala(sala)) {
            let verificaNome = verifica_nome(nome)

            if (verificaNome === 200) {
                // Verificacao ok
                cliente.nome = nome
                cliente.idSocket = socket.id
                cliente.sala = sala
                cliente.codigo = verificaNome
                cliente.pontuacao = 0
                cliente.px = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição x do jogador
                cliente.py = Math.floor(Math.random() * (qtd_peca - 1)) + 1; // Posição y do jogador

                // Posição do jogador na sala (primeiro, segundo, terceiro...) 
                salas.forEach((s) => {
                    if (s.nome === sala) {
                        cliente.posicao = s.qtd + 1
                    }
                })

                // Lista de jogadores por sala (atualizado para trabalhar com salas)
                if (sala==="a") {
                    jogadores_a.push(cliente)
                    sockets_a.push(socket.id)
                    for (let i = 0; i < sockets_a.length; i++) {
                        io.to(sockets_a[i]).emit("atualizarUsers", jogadores_a);
                    }
                } else if (sala==="b") {
                    jogadores_b.push(cliente)
                    sockets_b.push(socket.id)
                } else {
                    jogadores_c.push(cliente)
                    sockets_c.push(socket.id)
                }
                
                // Adicionando usuário na lista geral
                usuarios.push(cliente)

                // Incrementa jogadores na sala
                adiciona_usuario_sala(cliente.sala)

                // Finalizando registro cliente
                socket.emit('autenticacaoCliente', JSON.stringify(cliente))

            } else {
                // Usuário incorreto
                cliente.nome = ""
                cliente.idSocket = ""
                cliente.sala = ""
                cliente.codigo = verificaNome
                cliente.posicao = ""
                socket.emit('autenticacaoCliente', JSON.stringify(cliente))
            }
        } else {
            // Sala cheia
            cliente.nome = ""
            cliente.idSocket = ""
            cliente.sala = ""
            cliente.codigo = "402"
            cliente.posicao = ""
            socket.emit('autenticacaoCliente', JSON.stringify(cliente))
        }
    })

    // Processo de desconexão (atualizado para trabalhar com salas)
    socket.on('disconnectServidor', data => {
        var req = data.split(":")
        socket.emit('disconnectCliente', "ok:202")
        exclui_usuario(req[1])
    })

    // Socket desconectado forçado (atualizado para trabalhar com salas)
    socket.on('disconnect', () => {
        var ret = exclui_usuario(socket.id)
        if (ret=="a") {
            for (let i = 0; i < sockets_a.length; i++) {
                io.to(sockets_a[i]).emit("atualizarUsers", jogadores_a);
            }
        } else if (ret=="b") {
            for (let i = 0; i < sockets_b.length; i++) {
                io.to(sockets_b[i]).emit("atualizarUsers", jogadores_b);
            }
        } else if (ret=="c") {
            for (let i = 0; i < sockets_c.length; i++) {
                io.to(sockets_c[i]).emit("atualizarUsers", jogadores_c);
            }
        } else {
            console.log(ret)
        }
    })

    // Sinalização de áudio: oferta
    socket.on("offer", (socketId, description) => {
        socket.to(socketId).emit("offer", socket.id, description);
    });

    // Sinalização de áudio: atendimento da oferta
    socket.on("answer", (socketId, description) => {
        socket.to(socketId).emit("answer", description);
    });

    // Sinalização de áudio: envio dos candidatos de caminho
    socket.on("candidate", (socketId, signal) => {
        socket.to(socketId).emit("candidate", signal);
    });

    // Repassa posição para todos os jogadores de uma mesma sala (atualizado para trabalhar com salas)
    socket.on("repassaNovaPosicaoServidor", (jogador) => {
        var jog = JSON.parse(jogador)
        
        if (jog.sala=="a") {
            for (let i = 0; i < sockets_a.length; i++) {
                io.to(sockets_a[i]).emit("posicaoOutroJogador", jogador);
            }
        } else if (jog.sala=="b") {
            for (let i = 0; i < sockets_b.length; i++) {
                io.to(sockets_b[i]).emit("posicaoOutroJogador", jogador);
            }
        } else {
            for (let i = 0; i < sockets_c.length; i++) {
                io.to(sockets_c[i]).emit("posicaoOutroJogador", jogador);
            }
        }
    })

    // Quando algum jogador marca ponto (atualizado para trabalhar com salas)
    socket.on("reposicionaFruta", (jogador) => {
        var jog = JSON.parse(jogador)
        
        salas.forEach((s) => {
            if (s.nome === jog.sala) {
                s.fx = Math.floor(Math.random() * (qtd_peca - 1)) + 1;
                s.fy = Math.floor(Math.random() * (qtd_peca - 1)) + 1;
            }
        })

        // Enviando para jogadores da mesma sala
        if (jog.sala=="a") {
            for (var i = 0; i < jogadores_a.length; i++ ) {
                if (jogadores_a[i].nome == jog.nome) {
                    jogadores_a[i].pontuacao += 5 
                    jogadores_a[i].px = jog.px
                    jogadores_a[i].py = jog.py
                }
            }
            for (let i = 0; i < sockets_a.length; i++) {
                io.to(sockets_a[i]).emit("atualizarUsers", jogadores_a);
                io.to(sockets_a[i]).emit('novaPosicaoFruta',JSON.stringify(salas));
            }
        } else if (jog.sala=="b") {
            for (let i = 0; i < jogadores_b.length; i++ ) {
                if (jogadores_b[i].nome == jog.nome) {
                    jogadores_b[i].pontuacao += 5 
                    jogadores_b[i].px = jog.px
                    jogadores_b[i].py = jog.py
                }
            }
            for (let i = 0; i < sockets_b.length; i++) {
                io.to(sockets_b[i]).emit("atualizarUsers", jogadores_b);
                io.to(sockets_b[i]).emit('novaPosicaoFruta',JSON.stringify(salas));
            }
        } else {
            for (let i = 0; i < jogadores_c.length; i++ ) {
                if (jogadores_c[i].nome == jog.nome) {
                    jogadores_c[i].pontuacao += 5 
                    jogadores_c[i].px = jog.px
                    jogadores_c[i].py = jog.py
                }
            }
            for (let i = 0; i < sockets_c.length; i++) {
                io.to(sockets_c[i]).emit("atualizarUsers", jogadores_c);
                io.to(sockets_c[i]).emit('novaPosicaoFruta',JSON.stringify(salas));
            }
        }

    })

})

/* Verifica se o nome do cliente é válido */
verifica_nome = (nome) => {
    if (nome.includes(" ") || (nome.includes(":"))) {
        return 401
    }
    userFilter = usuarios.filter((user) => {
        return user.nome === nome
    })
    if (userFilter.length > 0) {
        return 400
    }
    return 200
}

/* Verifica se a sala está disponível */
verifica_sala = (nomeSala) => {

    salaFilter = salas.filter((sala) => {
        return sala.nome === nomeSala
    })

    if (salaFilter.length>0) {
        if (salaFilter[0].qtd >= salaFilter[0].max) {
            return false
        }
    }

    return true
}

/* Alterando quantidade usuários da sala */
adiciona_usuario_sala = (nomeSala) => {
    salas.forEach((sala) => {
        if (sala.nome === nomeSala) {
            ++sala.qtd
        }
    })
}

/* Exclui o usuário em caso de desconexão */
exclui_usuario = (idSocket) => {

    // Procurando usuário
    const clienteFilter = usuarios.filter((cliente) => {
        return cliente.idSocket === idSocket
    })

    if (clienteFilter.length > 0) {

        // Selecionando a sala do cliente
        const salaFilter = salas.filter((sala) => {
            return sala.nome === clienteFilter.sala
        })

        var posicaoAntigoJogador = clienteFilter[0].posicao
        var salaAntigoJogador = clienteFilter[0].sala

        // Alterando quantidade de jogadores na sala
        salas.forEach((sala) => {
            if (sala.nome === salaAntigoJogador) {
                --sala.qtd
                objetoSala = sala
            }
        })

        // Removendo usuário da lista Geral
        var index = usuarios.findIndex(cliente => cliente.idSocket === idSocket)
        usuarios.splice(index, 1)

        // Alterando posição dos jogadores na sala da lista geral de usuários
        usuarios.forEach((u) => {
            if (u.sala === salaAntigoJogador) {
                if (u.posicao > posicaoAntigoJogador) { // Apenas posições acimas são alteradas
                    --u.posicao
                }
            }
        })

        // Atualizando lista de jogadores da sala específica
        if (salaAntigoJogador=="a") {
            jogadores_a = []
            sockets_a = []
            for (let i=0;i<usuarios.length;i++) {
                if (usuarios[i].sala=="a") {
                    jogadores_a.push(usuarios[i])
                    sockets_a.push(usuarios[i].idSocket)
                }
            }
        } else if (salaAntigoJogador=="b") {
            jogadores_b = []
            sockets_b = []
            for (let i=0;i<usuarios.length;i++) {
                if (usuarios[i].sala=="b") {
                    jogadores_b.push(usuarios[i])
                    sockets_b.push(usuarios[i].idSocket)
                }
            }
        } else {
            jogadores_c = []
            sockets_c = []
            for (let i=0;i<usuarios.length;i++) {
                if (usuarios[i].sala=="c") {
                    jogadores_c.push(usuarios[i])
                    sockets_c.push(usuarios[i].idSocket)
                }
            }
        }

        return salaAntigoJogador
    }

    return "erro"
}

/* Escutando na porta 3000 */
server.listen(3000, () => {
    console.log("> Servidor ativo na porta 3000")
});