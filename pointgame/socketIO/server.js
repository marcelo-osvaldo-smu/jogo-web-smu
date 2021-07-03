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
const salas = [{nome: "millennium", qtd: 0, max: 5},{nome: "destroyer", qtd: 0, max:5},{nome: "x-wing", qtd: 0, max: 5}]

io.on('connection', socket =>{
    console.log(`Socket conectado: ${socket.id}`)

    // Processo de autenticação
    socket.on('autenticacao', data =>{
        var req = data.split(":")
        var nome = req[1]
        var sala = req[2]

        if(verifica_sala(sala)){
            let cliente = {}
            let verificaNome = verifica_nome(nome)

            if(verificaNome===200){
                // Verificacao ok
                cliente.nome = nome
                cliente.token = socket.id
                cliente.sala = sala
                usuarios.push(cliente)
                adiciona_usuario_sala(user.sala)
                ws.send("ok:"+user.token+":200")
            } else {
                // Usuário incorreto
                ws.send("nok:"+verificaNome)
                ws.close()
            }
        } else {
            // Sala cheia
            ws.send("nok:402")
            ws.close()
        } 



    })





})

// Escutando na porta 3000
server.listen(3000);