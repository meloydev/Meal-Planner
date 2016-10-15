const electron = require('electron'); 
const $ = require('jQuery');
const{ipcRenderer} = electron; 
 
$(document).ready(function () { 
     var c = $('#btnSubmit'); 
     c.click(()=>{ 
         var args = {firstname:'Mike',lastName:'Meloy'}; 
         ipcRenderer.send('async', args);
     }); 
});

//this is a callback from main window
ipcRenderer.on('ping', (event, arg) => {  
    // Print 5
    console.log(arg); 
});