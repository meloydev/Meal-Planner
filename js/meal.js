//meal.js

$(document).ready(function () {
  $('.bottom-right').off('click').click(mealClick.buttonExpand);
  $('#btnPrint').off('click').click(mealClick.save);
  $('#btnAdd').off('click').click(mealClick.modal);
  $('#btnUser').off('click').click(mealClick.modal);
  $('#contextMenu').on('mouseleave', mealHover.context);
  load.page();
});

var load = {
  page: () => {
    //check for a selected client to load saved meal
    let client = utilities.currentClient();
    if (client.id) {
      ipcRenderer.send('find-meal', client);
    }
  }
}

var mealSave = {
  save: (clientId) => {
    //list of tables making up the meal plan
    let elements = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    //mealplan object
    var mealPlan = {
      client: clientId,
      tables: [],
      totals: {
        calories: utilities.labelValue('lblCal'),
        protein: utilities.labelValue('lblProtein'),
        fat: utilities.labelValue('lblFat'),
        carb: utilities.labelValue('lblCarb')
      },
      macros: {
        protein: utilities.labelValue('lblMacroPro'),
        fat: utilities.labelValue('lblMacroFat'),
        carb: utilities.labelValue('lblMacroCarb'),
      }
    };

    for (var index = 0; index < elements.length; index++) {
      var tbl = {
        table: elements[index],
        items: []
      };
      let tblRows = $('#tbl' + elements[index] + ' tbody tr');

      tblRows.each(function (index, item) {
        let columns = $(item).find('td');
        //add meal to table's items array
        tbl.items.push({
          name: columns[0].innerHTML,
          category: columns[1].innerHTML,
          Quantity: columns[2].innerHTML,
          Calories: columns[3].innerHTML,
          Fat: columns[4].innerHTML,
          Carb: columns[5].innerHTML,
          Protein: columns[6].innerHTML
        });
      });
      mealPlan.tables.push(tbl);
    }
    //call main process
    ipcRenderer.send('add-meal', mealPlan);
  }
}

var mealClick = {
  print: function () {
    $('.base').toggleClass("base-expand");
    $('.top-left').toggleClass("middle-fix");
    //transfer info to print totals on top of page 
    $('#lblPrintCal').html($('#lblCal').html());
    $('#lblPrintPro').html($('#lblProtein').html());
    $('#lblPrintFat').html($('#lblFat').html());
    $('#lblPrintCarb').html($('#lblCarb').html());
    //macros
    $('#lblPrintProMacro').html($('#lblMacroPro').html());
    $('#lblPrintFatMacro').html($('#lblMacroFat').html());
    $('#lblPrintCarbMacro').html($('#lblMacroCarb').html());
    //print the window
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
  },
  save: function () {
    var clientId = utilities.currentClient().id;
    if (clientId) {
      mealSave.save(clientId);
    } else {
      ipcRenderer.send('show-ballon', { title: 'Error', content: 'No Client Selected' });
    }
  },
  load: function (meals) {
    //set macros  
    if (meals.macros) {
      document.getElementById('lblMacroFat').innerHTML = meals.macros.fat;
      document.getElementById('lblMacroCarb').innerHTML = meals.macros.carb;
      document.getElementById('lblMacroPro').innerHTML = meals.macros.protein;
    }
    //and totals
    if (meals.totals) {
      document.getElementById('lblCal').innerHTML = meals.totals.calories;
      document.getElementById('lblFat').innerHTML = meals.totals.fat;
      document.getElementById('lblCarb').innerHTML = meals.totals.carb;
      document.getElementById('lblProtein').innerHTML = meals.totals.protein;
    }
    $(meals.tables).each((index, meal) => {
      //get table
      var container = $('#meal' + meal.table);
      let tbl = $('#tbl' + meal.table);
      //create rows 
      for (var i = 0; i < meal.items.length; i++) {
        container.removeClass('meal-empty');
        let item = meal.items[i];
        let row = $('<tr>').append(
          $('<td>').text(item.name),
          $('<td>').text(item.category),
          $('<td>').text(item.Quantity),
          $('<td class="cal">').text(item.Calories),
          $('<td class="fat">').text(item.Fat),
          $('<td class="carb">').text(item.Carb),
          $('<td class="pro">').text(item.Protein)
        );
        row.hide().appendTo(tbl).fadeIn(1000);
      }
    });
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
  //right now, I'm only popping the one window
  //this code won't work if multiple windows are opened
  //in the future
  var client = utilities.currentClient();
  $('#txtUserPopName').val(client.firstName + ' ' + client.lastName);
});
ipcRenderer.removeAllListeners('meal-find-reply');
ipcRenderer.on('meal-find-reply', (event, arg) => {
  if (arg.isError) {
    var messageOptions = {
      body: arg.message,
      title: 'Error!'
    }
    utilities.notify(messageOptions);
  } else {
    if (arg.meal) {
      mealClick.load(arg.meal);
    } else {
      var client = utilities.currentClient();
      var message = `No meal plan associated with ${client.firstName} ${client.lastName}`;
      ipcRenderer.send('show-ballon', { title: 'Note', content: message });
    }
  }
});
