
var link = document.createElement('link');
link.setAttribute('rel', 'stylesheet');
link.setAttribute('type', 'text/css');
link.setAttribute('href', `https://fonts.googleapis.com/css2?family=${f1}:wght@300&display=swap`);
document.head.appendChild(link);
var all = document.getElementsByTagName('body')
for(i = 0; i<all.length; i++){
    all[i].style.fontFamily = f1
}
        