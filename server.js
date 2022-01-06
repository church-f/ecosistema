const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')   
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const PORT = process.env.PORT || 3000
const fs = require('fs')
const session = require('express-session');

const bcrypt = require('bcrypt');
const saltRounds = 10;

//stripee
const stripe = require('stripe')('sk_test_51K6ctHLkjitHDmEXkJOqUHXUFhMWlTVr1f1btpSa9vCBcJHy8g9lhoRiGnjDrH5QNHDNOXxMORNVfzXWpbRPYNyz00M6lvzN97');

//firebaseeeeeeeee
var firebase = require('firebase/compat/app');
require('firebase/compat/database');

const firebaseConfig = {
    apiKey: "AIzaSyBUPq34dC1D1u1SFXcumpCnDZZbzzBTlrw",
    authDomain: "prova-30e95.firebaseapp.com",
    databaseURL: "https://prova-30e95-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "prova-30e95",
    storageBucket: "prova-30e95.appspot.com",
    messagingSenderId: "297385515802",
    appId: "1:297385515802:web:b356f6f4c5b820027a6aa3",
    measurementId: "G-ELMJYQLRM3"
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

app.use(express.static(path.join(__dirname, "public")))
app.use(express.static(path.join(__dirname, "public/css")))
app.use(express.static(path.join(__dirname, "public/script")))
app.use(express.static(path.join(__dirname, "public/img")))

app.use(express.urlencoded());

var temi
fs.readFile('public/temi.json', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    temi = JSON.parse(data)
    
    
  })

var font
fs.readFile('public/font.json', 'utf8', (err, data) =>{
    if(err){
        console.log(err)
        return
    }
    font = JSON.parse(data)
})

var stanze = []
var admin = {}

var stanze_storielle = {}
var nomi = {}

var stanze_prop = {}
var nomi_prop = {}
io.on('connection', socket=>{
    //tema


    socket.on('colori', nome=>{
        var tema = data[nome]['tema']
        var temi_cop = data[nome]['temi']
        socket.emit('temi', {tema: tema, temi: temi_cop, all: temi, coin: data[nome]['coin']})
    })

    //cop tema
    socket.on('cop_tema', ({nome, coin, tema})=>{
        var p = data[nome]['temi']
        p.push(tema)
        firebase.database().ref(nome).update({
            coin: data[nome]['coin'] - coin,
            temi: p
        })
    })

    socket.on('applica_tema', ({nome, tema})=>{
        firebase.database().ref(nome).update({
            tema: tema
        })
    })

    //font
    

    socket.on('all_font', nome=>{
        var fontt = data[nome]['font']
        var font_cop = data[nome]['font_cop']
        socket.emit('set-shop', {font_sel :fontt, font_cop: font_cop, all: font, coin: data[nome]['coin']})
    })

    //cop font
    socket.on('cop_font', ({nome, coin, font})=>{
        var p = data[nome]['font_cop']
        p.push(font)
        firebase.database().ref(nome).update({
            coin: data[nome]['coin'] - coin,
            font_cop: p
        })
    })

    socket.on('applica_font', ({nome, font})=>{
        firebase.database().ref(nome).update({
            font: font
        })
    })

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
                try{

                    stanze_storielle[nome[1]]['ns'] -= 1
                    
                    delete stanze_storielle[nome[1]][nome[0]] 
                    stanze_storielle[nome[1]]['ng'] -= 1
                    if(stanze_storielle[nome[1]]['ng'] == 0){
                        delete stanze_storielle[nome[1]]
                    }
                }catch{

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
        try{

            stanze_storielle[stanza][nome] = storia
            stanze_storielle[stanza]['ns'] += 1
            socket.emit('coinn', data[nome]['coin'])
            socket.broadcast.to(stanza).emit('storiaa', {"storia": storia, "nome":nome})
            if(stanze_storielle[stanza]['ns'] == stanze_storielle[stanza]['ng']){
                io.to(stanza).emit('pronto')
                socket.emit('coinn', data[nome]['coin'])
            }
        }catch{

        }
    })
    socket.on('coin', ({stanza, nome, coin})=>{
        stanze_storielle[stanza]['p'] += 1
        if(stanze_storielle[stanza]['p'] == stanze_storielle[stanza]['ng']){
            stanze_storielle[stanza]['p'] = 0
            stanze_storielle[stanza]['ns'] = 0
            io.to(stanza).emit('next')
            socket.emit('coinn', data[nome]['coin'])
        }
        firebase.database().ref(nome).update({
            coin: data[nome]['coin'] + coin
        })
    })

    //CHI è PIù PROPENSO A
    socket.on('add_prop', ({nome, stanza})=>{
        socket.join(stanza)
        nomi_prop[socket.id] = [nome, stanza]
        io.to(stanza).emit('giocatore', nome)
    })

    socket.on('inizia_prop', ({stanza, lista_giocatori})=>{
        io.to(stanza).emit('start_prop', lista_giocatori)
        stanze_prop[stanza]['start'] = true
    })

    socket.on('voto', ({stanza, nome, voto})=>{
        stanze_prop[stanza][voto]++
        stanze_prop[stanza]['nv']++
        if(stanze_prop[stanza]['nv'] == stanze_prop[stanza]['ng']){
            io.to(stanza).emit('show_voti', stanze_prop[stanza])
        }
    })
})

function middleware(req, res, next){
    if (!req.session.nome) {
        res.redirect('/login')
        
      } else {
        next();
      }
}

function log(req, res, next){
    if (req.session.nome) {
        res.redirect('/')
        
      } else {
        next();
      }
}




// TUTTA LA PARTE USER
app.get('/',  (req, res)=>{
    if(req.session.nome){
        req.session.tema = data[req.session.nome]['tema']
        req.session.colori = temi[req.session.tema]
        req.session.font = data[req.session.nome]['font']
        req.session.fam = font[req.session.font]
        res.render('user', {nome: req.session.nome, coin:  data[req.session.nome]['coin'], colori: req.session.colori, fam: req.session.fam});
    }else{

        res.sendFile(__dirname+'/intro.html')
    }
    
})


app.get('/login',log,  (req, res)=>{
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

app.get('/registrati',log,  (req, res)=>{
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
            "coin":100,
            "tema":"classic",
            "temi":[
                "classic"
            ],
            "font":"Rubik",
            "font_cop":[
                "Rubik"
            ]
          })
    }else{
        res.redirect('/registrati')
    }

})

app.get('/god', (req, res)=>{
    if(data[req.session.nome]['admin']== true){
        res.render('god', {data})
    }else{
        res.redirect('/')
    }
})

app.get('/impostazioni', middleware, (req, res)=>{
    
    res.render('impostazioni', {nome: req.session.nome, colori: req.session.colori, fam: req.session.fam})


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


app.post('/logout', middleware,(req, res)=>{
    req.session.nome = ''
    res.redirect('/')
})

app.get('/shop/coin', middleware, (req, res)=>{
    res.render('shop_coin', {nome: req.session.nome, colori: req.session.colori, fam: req.session.fam})
})

app.get('/shop/font', middleware, (req, res)=>{
    res.render('shop_font', {nome: req.session.nome, colori: req.session.colori, fam: req.session.fam})
})

app.get('/shop/temi', middleware, (req, res)=>{
    res.render('shop_temi', {nome: req.session.nome, colori: req.session.colori, fam: req.session.fam})
})

app.get('/contattaci', middleware, (req, res)=>{
    res.render('contattaci', {nome: req.session.nome, colori: req.session.colori, fam: req.session.fam})
})

app.post('/contattaci', middleware, (req, res)=>{
    const msg = req.body.msg
    const mail = req.body.mail
    const nome = req.session.nome

    if(msg != ''){
        res.redirect('/')
        firebase.database().ref('msg/'+nome).set({
            "mail": mail,
            "msg": msg
        })
    }else{
        res.redirect('/contattaci')
    }
})

//bonifici
app.get('/manda', middleware, (req, res)=>{
    res.render('bonifico', {nome: req.session.nome, colori: req.session.colori, fam: req.session.fam})
})

//fai il bonifico
app.post('/bonifico_post', (req, res)=>{
    var nome = req.body.nome
    var cifra = req.body.cifra
    
    if(data[nome] != undefined && cifra <= data[req.session.nome]['coin']){
       
        firebase.database().ref(req.session.nome).update({
            coin: data[req.session.nome]['coin']-= parseInt(cifra)
        })
        firebase.database().ref(nome).update({
            coin: data[nome]['coin']+= parseInt(cifra)
        })
        res.redirect('/')
    }else{
        
        res.redirect('/bonifico')
    }
})

//pagamenti

var url = 'https://friendtripp.herokuapp.com/'

//150 coin
app.post('/shop1',middleware, async(req, res)=>{
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            
            price: 'price_1K6dV7LkjitHDmEXkDRxwOlI',
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${url}grazie?coin=150`,
        cancel_url: `${url}`,
      });
      req.session.cop = true
      res.redirect(303, session.url);
})

//500 coin
app.post('/shop2',middleware, async(req, res)=>{
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            
            price: 'price_1K8C7HLkjitHDmEXFRv3xpLO',
            quantity: 1,
          },
        ],
        mode: 'payment',
        
        success_url: `${url}grazie?coin=500`,
        cancel_url: `${url}`,
      });
      req.session.cop = true
      res.redirect(303, session.url);
      
})

//1000 coin
app.post('/shop3',middleware, async(req, res)=>{
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            
            price: 'price_1K8C8ELkjitHDmEXBtwHvU2K',
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${url}grazie?coin=1000`,
        cancel_url: `${url}`,
      });
      req.session.cop = true
      res.redirect(303, session.url);
})

//aggiunge coin
app.get('/grazie', middleware, (req, res)=>{
    if(req.session.cop === true){

        firebase.database().ref(req.session.nome).update({
            coin: data[req.session.nome]['coin'] + parseInt(req.query.coin) 
        })

        req.session.cop = false
        res.render('grazie', {nome: req.session.nome, colori: req.session.colori, fam: req.session.fam})
    }else{
        res.redirect('/')
    }
})

//ASSASSINO

app.get('/assassino', middleware, (req, res)=>{
    res.render('assassino/home', {colori: req.session.colori, fam: req.session.fam})
})

app.get('/assassino/:room/admin', middleware,(req, res)=>{
    res.render('assassino/admin', {stanza: req.params.room, colori: req.session.colori, fam: req.session.fam})
    
})
app.post('/assassino/admin', middleware,(req, res)=>{
    if(stanze.includes(req.body.crea) != false){
        res.redirect('/')
    }
    
    stanze.push(req.body.crea)
    res.redirect('/assassino/'+req.body.crea+'/admin')
})

app.get('/assassino/:room/user', middleware,(req, res)=>{
    res.render('assassino/user', {stanza: req.params.room, colori: req.session.colori, fam: req.session.fam})
    
    
})
app.post('/assassino/user', middleware,(req, res)=>{
    if(stanze.includes(req.body.entra) != false){
        res.redirect('/assassino/'+req.body.entra+'/user')
    }else{

        res.redirect('/assassino')
    }

})
app.get('/assassino/dio',middleware, (req, res)=>{
    res.send(stanze)
})

app.get('/assassino/regole', middleware,(req, res)=>{
    res.render('assassino/regole', {colori: req.session.colori, fam: req.session.fam})
})

//STORIELLE

app.get('/storielle', middleware,(req, res)=>{
    req.session.stanza = ''
    res.sendFile(__dirname+'/storielle/main.html')
})

app.get('/storielle/regole', middleware, (req, res)=>{
    res.sendFile(__dirname+'/storielle/regole.html')
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
        stanze_storielle[stanza]={"ng": 1, "ns":0, "p":0}
        stanze_storielle[stanza][req.session.nome] = ''
        
    }else{
        res.redirect('/storielle')
    }
})

app.get('/storielle/:stanza', middleware,(req, res)=>{
    var stanzaa = req.session.stanza

    if(req.session.pass == true ){
        
        res.render('user_storielle', {stanza: stanzaa, nome:req.session.nome, coin: data[req.session.nome]['coin']})
    }else{

        res.redirect('/storielle')
    }
})

//CHI è PIù PROPENSO A(little bit ignorante)

app.get('/propenso', middleware, (req, res)=>{
    res.render('propenso/home', {colori: req.session.colori, fam: req.session.fam})
    req.session.admin_prop = false
})

app.get('/propenso/regole', middleware, (req, res)=>{
    res.send('regole')
})

app.post('/propenso/entra', middleware,(req, res)=>{
    const stanza = req.body.stanza
    req.session.admin_prop = false
    if(stanza in stanze_prop == true){
        req.session.pass = true
        req.session.stanza = stanza
        res.redirect('/propenso/'+stanza)
        stanze_prop[stanza][req.session.nome] = 0
        stanze_prop[stanza]['ng'] ++
        
        
    }else{
        res.redirect('/propenso')
    }
})

app.post('/propenso/crea',middleware, (req, res)=>{
    const stanza = req.body.stanza
    if(stanza in stanze_prop != true){
        req.session.pass = true
        req.session.admin_prop = true
        req.session.stanza = stanza
        res.redirect('/propenso/'+stanza)
        stanze_prop[stanza]={"ng": 1, "nv":0, "start":false}
        stanze_prop[stanza][req.session.nome] = 0
        
    }else{
        res.redirect('/propenso')
    }
})

app.get('/propenso/:stanza', middleware,(req, res)=>{
    var stanzaa = req.session.stanza

    if(stanzaa in stanze_prop){
        if(stanze_prop[stanzaa]['start'] == false){

            if(req.session.pass == true ){
                if(req.session.admin_prop == true){
                    res.render('propenso/admin', {stanza: stanzaa, nome:req.session.nome, coin: data[req.session.nome]['coin'], colori: req.session.colori, fam: req.session.fam})
                }else{
                    res.render('propenso/user', {stanza: stanzaa, nome:req.session.nome, coin: data[req.session.nome]['coin'], colori: req.session.colori, fam: req.session.fam})
                }
                
            }else{
        
                res.redirect('/propenso')
            }
        }else{
            res.redirect('/propenso')
        }
    }else{
    
        res.redirect('/propenso')
    }
    
})

// ERRORE 404
app.get('*', (req, res)=>{
    res.redirect('/')
})