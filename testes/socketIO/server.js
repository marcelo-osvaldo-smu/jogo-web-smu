const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

//app.use(express.static(path.join(__dirname, 'public')));
//app.set('views', path.join(__dirname, 'public'));
//app.engine('html', require('ejs').renderFile);
//app.set('view engine', 'html');

app.use('/', (req, res) => {
   res.send("Hello!")
})

// Lista de usários ativos
let usuarios = []
// Lista de salas disponíveis
var salas = [{nome: "a", qtd: 0, max: 3},{nome: "destroyer", qtd: 0, max: 5},{nome: "x-wing", qtd: 0, max: 5}]

io.on('connection', socket =>{

    // Processo de autenticação
    socket.on('autenticacaoServidor', data =>{
        var req = data.split(":")
        var nome = req[1]
        var sala = req[2]
        
        if(verifica_sala(sala)){
            let cliente = {}
            let verificaNome = verifica_nome(nome)

            if(verificaNome===200){
                // Verificacao ok
                cliente.nome = nome
                cliente.idSocket = socket.id
                cliente.sala = sala
                cliente.codigo = verificaNome

                // Posição do jogador na sala (primeiro, segundo, terceiro...) 
                salas.forEach((s) => {
                    if(s.nome === sala){
                        cliente.posicao = s.qtd+1
                    }
                })
                usuarios.push(cliente)
                adiciona_usuario_sala(cliente.sala)

                // Broadcast de lista de novos usuários (FALTA SELECIONAR A SALA - FUTURAMENTE NÃO VAI SER BROADCAST)
                io.sockets.emit('atualizarUsers', usuarios);

                // Finalizando registro cliente
                socket.emit('autenticacaoCliente',JSON.stringify(cliente)) 

            } else {
                // Usuário incorreto
                cliente.nome = ""
                cliente.idSocket = ""
                cliente.sala = ""
                cliente.codigo = verificaNome
                cliente.posicao = ""
                socket.emit('autenticacaoCliente',JSON.stringify(cliente))
            }
        } else {
            // Sala cheia
            cliente.nome = ""
            cliente.idSocket = ""
            cliente.sala = ""
            cliente.codigo = "402"
            cliente.posicao = ""
            socket.emit('autenticacaoCliente',JSON.stringify(cliente))
        } 
    })

    // Processo de desconexão
    socket.on('disconnectServidor', data => {
        var req = data.split(":")
        socket.emit('disconnectCliente',"ok:202")
        exclui_usuario(req[1])
    })

     // Socket desconectado forçado
     socket.on('disconnect', () => {
        exclui_usuario(socket.id)
        // Envia para todos a lista de nomes atualizada
        io.sockets.emit('atualizarUsers', usuarios);
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

})

/* Verifica se o nome do cliente é válido */
verifica_nome = (nome) => {
    if(nome.includes(" ") || (nome.includes(":"))){
        return 401
    }
    userFilter = usuarios.filter((user) => {
        return user.nome === nome
    })
    if(userFilter.length > 0){
        return 400
    }
    return 200
}

/* Verifica se a sala está disponível */
verifica_sala = (nomeSala) => {

    salaFilter = salas.filter( (sala) => {
        return sala.nome === nomeSala
    })
    
    if(salaFilter[0].qtd >= salaFilter[0].max){
        return false
    }
    return true
}

/* Alterando quantidade usuários da sala */
adiciona_usuario_sala = (nomeSala) => {
    salas.forEach((sala) => {
        if(sala.nome === nomeSala){
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

    // Alterando jogadores na sala
    salas.forEach((sala) => {
        if(sala.nome === clienteFilter[0].sala){
            --sala.qtd 
        }
    })

    // Removendo usuário
    var index = usuarios.findIndex( cliente => cliente.idSocket === idSocket)
    usuarios.splice(index,1) 

    return true
}

/* Escutando na porta 3000 */
server.listen(3000);