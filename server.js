const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')   
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const PORT = process.env.PORT || 3000

const session = require('express-session');

const bcrypt = require('bcrypt');
const saltRounds = 10;

var firebase = require('firebase/compat/app');
require('firebase/compat/database');

const firebaseConfig = {
    apiKey: "AIzaSyBZReLMy423JAQq9v1SsZl5tqZQzkowd-0",
    authDomain: "big-sito.firebaseapp.com",
    databaseURL: "https://big-sito-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "big-sito",
    storageBucket: "big-sito.appspot.com",
    messagingSenderId: "111140400866",
    appId: "1:111140400866:web:616765f40fa81b71c2f8bb",
    measurementId: "G-WNJC59Q868"
  };
firebase.initializeApp(firebaseConfig)



app.use(session({
    secret: 'token segreto',
    resave: true,
    cookie: { maxAge: 10 * 365 * 24 * 60 * 60 },
    saveUninitialized: false,
    unset: 'destroy',
    
    name: 'dioporco',
    
}));
var data 
firebase.database().ref().on('value', (snapshot) => {
    data = snapshot.val();
});



server.listen(PORT)


app.set('view engine', 'ejs')


app.use(express.static(path.join(__dirname, "public/css")))
app.use(express.static(path.join(__dirname, "public/script")))
app.use(express.static(path.join(__dirname, "public/img")))

app.use(express.urlencoded());



var stanze = []
var admin = {}

var stanze_storielle = {}
var nomi = {}
io.on('connection', socket=>{
    //ASSASSINO SOCKET
    //aggiungi persona nella stanza
    socket.on('entra', stanza=>{
        socket.join(stanza)
    })
    socket.on('crea', stanza=>{
        socket.join(stanza)
        admin[stanza] = socket.id
        
        
    })
    //distrubuisci ruoli
    socket.on('dist', ({stanza, complice})=>{
        var ruoli = ['sbirro', 'puttana', 'assassino']
        var sottrazione = 3
        if(complice == true){
            ruoli.push('complice')
            sottrazione++
        }
        var aa = socket.adapter.rooms.get(stanza)
        
        const clients = aa ? aa.size : 0;
        if(clients > 3){
            var rim = clients-sottrazione
            for(var i=0; i<rim; i++){
                
                ruoli.push('cittadino')
            }
        }
        ruoli.sort(function(a, b){return 0.5 - Math.random()})
        var t = 0
        for(var a of aa){
            io.to(a).emit('ruolo', ruoli[t])
            t++
            
        }
        
        
    })
    //distruggi stanza se l'admin esce
    socket.on('disconnect', ()=>{
        if(socket.id in nomi == true){
            var nome = nomi[socket.id]
            if(nome != undefined){
                
                stanze_storielle[nome[1]]['ns'] -= 1
                
                delete stanze_storielle[nome[1]][nome[0]] 
                stanze_storielle[nome[1]]['ng'] -= 1
                if(stanze_storielle[nome[1]]['ng'] == 0){
                    delete stanze_storielle[nome[1]]
                }

            }}
        else{
            for(x in admin){
                var nome = admin[x]
                if( nome== socket.id){
                    const index = stanze.indexOf(x);
                    if (index > -1) {
                    stanze.splice(index, 1);
                    }
                }
            }}
        
        
    })
    //STORIELLE
    socket.on('add', ({nome, stanza})=>{
        socket.join(stanza)
        nomi[socket.id] = [nome, stanza]
        
    })
    socket.on('storia', ({storia, nome, stanza})=>{
        stanze_storielle[stanza][nome] = storia
        stanze_storielle[stanza]['ns'] += 1
        socket.broadcast.to(stanza).emit('storiaa', {"storia": storia, "nome":nome})
        if(stanze_storielle[stanza]['ns'] == stanze_storielle[stanza]['ng']){
            io.to(stanza).emit('pronto')
        }
    })
    socket.on('coin', ({nome, coin})=>{
        
        firebase.database().ref(nome).update({
            coin: data[nome]['coin'] + coin
        })
    })
})

function middleware(req, res, next){
    if (!req.session.nome) {
        next()
        
      } else {
        next();
      }
}




// TUTTA LA PARTE USER
app.get('/', (req, res)=>{
    
    res.render('user', {nome: 'nome', coin:  10});
    
    
})


app.get('/login', (req, res)=>{
    res.sendFile(__dirname+'/login.html')
    req.session.red = true
    
})

app.post('/login-check', async(req, res)=>{
    var nome = req.body.user
    var pwd = req.body.password
    try{
        const ao = await bcrypt.compare(pwd, data[nome]['pwd'])
        if(ao){
        
            req.session.nome = nome
            
            res.redirect('/')
        }else{
            res.redirect('/login')
        }

    }catch(err){
        res.redirect('/login')
    }
})

app.get('/registrati', (req, res)=>{
    res.sendFile(__dirname+'/registrati.html')
})

app.post('/nuovo-check', async (req, res)=>{
    var nome = req.body.user
    var pwd = req.body.password

    if(data[nome] == undefined){
        var hash_pwd = await bcrypt.hash(pwd, saltRounds)
        
        req.session.nome = nome
        res.redirect('/')
        firebase.database().ref(nome).set({
            "admin": false,
            "pwd":hash_pwd,
            "coin":0.00
          })
    }else{
        res.redirect('/registrati')
    }

})


app.get('/impostazioni', (req, res)=>{
    
    res.sendFile(__dirname+'/impostazioni.html')

    
})
app.post('/cambia_nome', (req, res)=>{
    var nome = req.body.user
    if(data[nome] == undefined){
        var temp = data[req.session.nome]
        data[nome] = temp
        firebase.database().ref(req.session.nome).remove()
        
        firebase.database().ref(nome).set(
            temp
        )
        req.session.nome = nome
          
        
        res.redirect('/')
    }else{
        res.redirect('/impostazioni')
    }
})

app.post('/cambia_pwd', async (req, res)=>{
    var pwd = req.body.pwd
    
    var hash_pwd = await bcrypt.hash(pwd, saltRounds)
    res.redirect('/')
    
    firebase.database().ref(req.session.nome).update({
        pwd: hash_pwd
    })
    
})

app.post('/delete', (req, res)=>{
    delete data[req.session.nome]
    firebase.database().ref(req.session.nome).remove()
    req.session.nome = ''
    res.redirect('/')
})

app.get('/god', (req, res)=>{
    if(data[req.session.nome]['admin']== true){
        res.render('god', {data})
    }else{
        res.redirect('/')
    }
})

app.post('/logout', middleware,(req, res)=>{
    req.session.nome = ''
    res.redirect('/')
})

app.get('/shop', middleware, (req, res)=>{
    res.sendFile(__dirname + '/shop.html')
})

//ASSASSINO

app.get('/assassino', middleware, (req, res)=>{
    res.sendFile(__dirname+'/assassino/home.html')
})

app.get('/assassino/:room/admin', middleware,(req, res)=>{
    res.render('admin', {stanza: req.params.room})
    
})
app.post('/assassino/admin', middleware,(req, res)=>{
    if(stanze.includes(req.body.crea) != false){
        res.redirect('/')
    }
    
    stanze.push(req.body.crea)
    res.redirect('/assassino/'+req.body.crea+'/admin')
})

app.get('/assassino/:room/user', middleware,(req, res)=>{
    res.render('user_assassino', {stanza: req.params.room})
    
    
})
app.post('/assassino/user', middleware,(req, res)=>{
    if(stanze.includes(req.body.entra) != false){
        res.redirect('/assassino/'+req.body.entra+'/user')
    }

})
app.get('/assassino/dio',middleware, (req, res)=>{
    res.send(stanze)
})

app.get('/assassino/regole', middleware,(req, res)=>{
    res.sendFile(__dirname+'/assassino/regole.html')
})

//STORIELLE

app.get('/storielle', middleware,(req, res)=>{
    req.session.stanza = ''
    res.sendFile(__dirname+'/storielle/main.html')
})

app.post('/storielle/entra', middleware,(req, res)=>{
    const stanza = req.body.stanza
    
    if(stanza in stanze_storielle == true){
        req.session.pass = true
        req.session.stanza = stanza
        res.redirect('/storielle/'+stanza)
        stanze_storielle[stanza][req.session.nome] = ''
        stanze_storielle[stanza]['ng'] ++
        
        
    }else{
        res.redirect('/storielle')
    }
})

app.post('/storielle/crea',middleware, (req, res)=>{
    const stanza = req.body.stanza
    if(stanza in stanze_storielle != true){
        req.session.pass = true
        req.session.stanza = stanza
        res.redirect('/storielle/'+stanza)
        stanze_storielle[stanza]={"ng": 1, "ns":0}
        stanze_storielle[stanza][req.session.nome] = ''
        
    }else{
        res.redirect('/storielle')
    }
})

app.get('/storielle/:stanza', middleware,(req, res)=>{
    var stanzaa = req.session.stanza

    if(req.session.pass == true ){
        
        res.render('user_storielle', {stanza: stanzaa, nome:req.session.nome})
    }else{

        res.send('porcoddio')
    }
})


// ERRORE 404
app.get('*', (req, res)=>{
    res.redirect('/')
})
