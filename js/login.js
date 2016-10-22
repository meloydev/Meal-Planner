const electron = require('electron');
//const $ = require('jQuery');
const {ipcRenderer} = electron;

$(document).ready(function () { 
    var c = $('#btnSubmit');
    c.click(() => {
        var userName = $('#inputEmail').val();
        var passWord = $('#inputPassword').val();
        ipcRenderer.send('login', { email: userName, passWord: passWord });
    });
});

//this is a callback from main window
ipcRenderer.on('loginFail', (event, arg) => { 
  var moda= $("#myModal");
  moda.modal();
});