//meal.js

$(document).ready(function () {
  $('.bottom-right').off('click').click(mealClick.buttonExpand);
  $('#btnPrint').off('click').click(mealClick.print);
  $('#btnAdd').off('click').click(mealClick.modal);
  $('#btnUser').off('click').click(mealClick.modal);
  $('#contextMenu').on('mouseleave', mealHover.context);
});

var mealClick = {
  print: function () {
    $('.base').toggleClass("base-expand");
    $('.top-left').toggleClass("middle-fix");
    window.print();
  },
  modal: function () {
    $('.base').toggleClass("base-expand");
    $('.top-left').toggleClass("middle-fix");
    var loc = $(this).data('location');
    var title = $(this).data('title');
    ipcRenderer.send('modal-window', { body: loc, title: title });
  },
  buttonExpand: function () {
    $('.base').toggleClass("base-expand");
    //padding for that middle button
    $('.top-left').toggleClass("middle-fix");
  }
};

var mealHover = {
  context: function () {
    $(this).slideUp(200);
  }
}
// Listen for async-reply message from main process
ipcRenderer.removeAllListeners('modal-window-reply');
ipcRenderer.on('modal-window-reply', (event, arg) => {
  //modal window on parent page
  var popUp = $('#modal-window');
  //set the title of the modal window
  var title = popUp.find('.modal-dialog').find('.modal-title');
  title.text(arg.title);
  //what is passed back
  var contents = $(arg.body);
  //meat of the modal
  var popupBody = popUp.find('.modal-dialog').find('.modal-body');
  //clean it out
  popupBody.empty();
  //add the body to the modal
  contents.appendTo(popupBody);
  //show modal
  popUp.modal();
});