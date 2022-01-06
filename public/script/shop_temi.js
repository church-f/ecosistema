const centro = document.getElementById('centro')
var coinn 
var al
socket.on('temi', ({tema, temi, all, coin})=>{
    coinn = coin
    al = all
    for(i in all){
        var ne = document.createElement('div')
        if(temi.includes(i) || temi == i){
            ne.innerHTML = `<div class="tema" onclick="sel('${i}')">
                                <div class="sx"style="background-color:${all[i][1]} ;"></div>
                                <div class="dx" style="background-color:${all[i][0]} ;" ></div>
                                <img src="/cop.png" id="cop">
                            </div>
                        `
            if(tema == i){
                ne.classList.add('sel')
            }
        }else{
            ne.innerHTML = `<div class="tema" onclick="ask(${all[i][2]}, '${i}')">
                                <div class="sx"style="background-color:${all[i][1]} ;"></div>
                                <div class="dx" style="background-color:${all[i][0]} ;" ></div>
                                <p id="prezzo">${all[i][2]}</p>
                            </div>
                        `
        }
    ne.classList.add('tema')
        centro.appendChild(ne)
    }      
})

function cop(prezzo, tema){
    if(prezzo <= coinn){
        socket.emit('cop_tema', {nome: nome, coin: prezzo, tema: tema})
        document.location.reload()
    }else{
        console.log('no cop')
    }
}

function ask(prezzo, tema){
    del.style.display = 'block'
    ann.style.color = al[tema][0]
    dom.style.color = al[tema][0]
    btn.style.color = al[tema][1]
    btn.style.backgroundColor = al[tema][0]
    del.style.backgroundColor = al[tema][1]
    btn.addEventListener('click', ()=>{
        cop(prezzo, tema)
    })
}

function sel(tema){
    socket.emit('applica_tema', {nome: nome, tema: tema})
    document.location.reload()
}


