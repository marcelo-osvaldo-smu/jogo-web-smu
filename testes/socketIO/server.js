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
var salas = [{nome: "millennium", qtd: 0, max: 3},{nome: "destroyer", qtd: 0, max: 5},{nome: "x-wing", qtd: 0, max: 5}]

io.on('connection', socket =>{
    // console.log(`Socket conectado: ${socket.id}`)

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
                usuarios.push(cliente)
                adiciona_usuario_sala(cliente.sala)
                socket.emit('autenticacaoCliente',"ok:"+cliente.idSocket+":200")
            } else {
                // Usuário incorreto
                socket.emit('autenticacaoCliente',"nok:"+verificaNome)
            }
        } else {
            // Sala cheia
            socket.emit('autenticacaoCliente',"nok:402")
        } 

        // Lista de usuários ativos
        console.log("> Usuários ativos")
        for (let i = 0; i < usuarios.length; i++) {
            console.log(usuarios[i].nome)
        }
    })

    // Processo de desconexão
    socket.on('disconnectServidor', data => {
        var req = data.split(":")
        socket.emit('disconnectCliente',"ok:202")
        exclui_usuario(req[1])
    })


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