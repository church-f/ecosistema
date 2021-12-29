socket.emit('all_font', nome)
var coinn 
const centro = document.getElementById('centro')
socket.on('set-shop', ({font_sel, font_cop, all, coin})=>{
    coinn = coin
    for(i in all){
        
        var ne = document.createElement('div')
        if(font_cop.includes(i) || font_cop == i){
            ne.innerHTML = `<div class="font" style="font-family: ${all[i][1]}; color: ${c1}" onclick="sel('${i}')">
                                <h1 id="nome" class="text"  style="font-family: ${all[i][1]};">${nome}</</h1>
                                <h1 id="font" class="text"  style="font-family: ${all[i][1]};">${all[i][0]}</h1>
                                <img src="/cop.png" id="cop">
                            </div>
                        `
            if(font_sel == i){
                ne.classList.add('sel')
            }
        }else{
            ne.innerHTML = `<div class="font" style="font-family: ${all[i][1]}; color: ${c1}" onclick="ask(${all[i][2]}, '${i}')">
                                <h1 id="nome" class="text" style="font-family: ${all[i][1]};" >${nome}</h1>
                                <h1 id="font" class="text" style="font-family: ${all[i][1]};">${all[i][0]}</</h1>
                                <h1 id="prezzo" class="text" style="font-family: ${all[i][1]};">${all[i][2]}</h1>
                            </div>
                        `
        }
    ne.classList.add('font')
        centro.appendChild(ne)
    }
    
})

function cop(prezzo, font){
    if(prezzo <= coinn){
        socket.emit('cop_font', {nome: nome, coin: prezzo, font: font})
        document.location.reload()
    }else{
        console.log('no cop')
    }
}

function ask(prezzo, tema){
    del.style.display = 'block'
    ann.style.color = c1
    dom.style.color = c1
    btn.style.color = c2
    btn.style.backgroundColor = c1
    del.style.backgroundColor = c2
    btn.addEventListener('click', ()=>{
        cop(prezzo, tema)
    })
}

function sel(font){
    socket.emit('applica_font', {nome: nome, font: font})
    document.location.reload()
}