


//genera i colori per il bg random
var r1 = Math.floor(Math.random()*255);
var g1 = Math.floor(Math.random()*255);
var b1 = Math.floor(Math.random()*255);

var r2 = Math.floor(Math.random()*255);
var g2 = Math.floor(Math.random()*255);
var b2 = Math.floor(Math.random()*255);
//mette il bg
document.getElementById('body').style.background = "linear-gradient(-45deg, rgb("+r1+", "+g1+", "+b1+"), rgb("+r2+", "+g2+", "+b2+"))";








