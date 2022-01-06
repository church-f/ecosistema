


function applica_tema(){
    const primi = document.getElementsByClassName('primo')
    const primi_c = document.getElementsByClassName('primo_c')
    const secondi = document.getElementsByClassName('secondo')
    const secondi_c = document.getElementsByClassName('secondo_c')
    for(i = 0; i< primi_c.length; i++){
        primi_c[i].style.backgroundColor = c1
    }
    for(i = 0; i< primi.length; i++){
        primi[i].style.color = c1
    }
    for(i = 0; i< secondi_c.length; i++){
        secondi_c[i].style.backgroundColor = c2
    }
    for(i = 0; i< secondi.length; i++){
        secondi[i].style.color = c2
    }
}
applica_tema()



