  
$(document).ready(function () {  
    var c = $('#btnSubmit');
    c.click(() => {
        var name = $('#txtUserName').val();
        var pass = $('#txtPassWord').val();
        ipcRenderer.send('login', { userName: name, passWord: pass });
    });
});

//this is a callback from main window
ipcRenderer.on('loginFail', (event, arg) => { 
  debugger;
});