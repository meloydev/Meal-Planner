//foodAdd.js

$(document).ready(function () {
    //when the user changes the multiplier
    $('#txtMulti').off('input').on('input', actions.multiplierChange);
    //user click event for adding food
    $("#btnAddFood").off('click').click(actions.addItem);
    //autocomplete stuff
    var el = $('#txtAutoComplete');
    el.keydown(autocomplete.textChange);
    el.autocomplete({
        lookup: autocomplete.lookup,
        onSelect: autocomplete.onSelect
    });

    var options = {
        template: '<div class="popover" role="tooltip" style="width: 200px;"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"><div class="data-content"></div></div></div>',
        html: true,
        placement: 'right',
        title: 'Nutient Values',
        trigger: 'manual'
    };
    el.popover(options);
});

//for now, setting a global object
var callback = {
    done: function (result) {

    }
};

var actions = {
    addItem: function () {
        var item = JSON.parse(localStorage.getItem('food-item'));
        if (item != null) {
            var meal = $('#ddlMealNumber').val();
            var userSelectedValue = parseInt($('#txtMulti').val());
            //if not a number or less than 1, return 1
            var multiplier = !isNaN(userSelectedValue) && userSelectedValue > 0 ? userSelectedValue : 1;
            //add item to specific grid 
            grid.addRow(item, meal, multiplier);
            //remove hide class if neccessary
            grid.unhideMeal(meal);

            //clear form and ready  
            var mealAddForm = document.getElementById('frmFoodAdd');
            //add notes to meal   
            var customComment = $('#txtComment').val();
            grid.addComment(meal, customComment);

        } else {
            var messageOptions = {
                body: 'Alert!',
                title: 'Please select an item'
            };
            utilities.notify(messageOptions);
        }
        var txt = document.getElementById('txtAutoComplete');
        txt.focus();
    },
    multiplierChange: function () {
        try {
            //grab the controls holding current values
            var popCal = document.getElementById('popCal');
            var popPro = document.getElementById('popPro');
            var popCar = document.getElementById('popCarb');
            var popFat = document.getElementById('popFat');
            //currently selected item for base values
            var item = JSON.parse(localStorage.getItem('food-item'));
            //get the users new multiplier

            var multiplier = parseFloat(this.value);
            var safe = isNaN(multiplier) ? 1 : multiplier;
            //place current values multiplied by new multiplier!
            popCal.innerHTML = (item.calorie * safe).toFixed(1);
            popPro.innerHTML = (item.protein * safe).toFixed(1);
            popCar.innerHTML = (item.carb * safe).toFixed(1);
            popFat.innerHTML = (item.fat * safe).toFixed(1);

        } catch (error) {
            alert('Select a food item first');
            this.value = 1;
        }
    }
};

var grid = {
    addComment: function (meal, note) {
        if (note) {
            var comment = $(`#notesMeal${meal} p`);
            //append new comment
            comment.html(`${comment.html()}<div>${note}</div>`);
        }
    },
    addRow: function (a, b, c) { //item, meal, multiplier
        //get table body to append a new row 
        var table = $(`#tbl${b} > tbody:last-child`);
        //create row from dropdown selection
        var row = grid.generateRow(a, c);

        //set row ID based on table and row count
        var rowId = `table_${b}_row_${table.children().length}`;
        row.attr('id', rowId);
        //add actions
        row.find('.delete i').click(rowId, mealClick.removeRow);

        //fade in for effect
        row.hide().appendTo(table).fadeIn(1000);

        //get totals
        var allCal = $('.cal');
        var allFat = $('.fat');
        var allCarb = $('.carb');
        var allProtein = $('.pro');
        //update totals
        grid.updateTotal(allProtein, 'lblProtein');
        grid.updateTotal(allFat, 'lblFat');
        grid.updateTotal(allCarb, 'lblCarb');
        grid.updateTotal(allCal, 'lblCal');
        //macros
        grid.updateMacro(allFat, 9, allCal, 'lblMacroFat');
        grid.updateMacro(allCarb, 4, allCal, 'lblMacroCarb');
        grid.updateMacro(allProtein, 4, allCal, 'lblMacroPro');
        //set contxt menu 
    },
    generateRow: function (data, multiplier) {
        var safe = isNaN(multiplier) ? 1 : multiplier;
        var row = $('<tr>').append(
            $('<td>').text(data.name),
            $('<td>').text(data.category),
            $('<td>').text(`${multiplier} ${data.serving}`),
            $('<td class="cal">').text((data.calorie * safe).toFixed(1)),
            $('<td class="fat">').text((data.fat * safe).toFixed(1)),
            $('<td class="carb">').text((data.carb * safe).toFixed(1)),
            $('<td class="pro">').text((data.protein * safe).toFixed(1)),
            $('<td class="delete">').html('<i class="btn-circle-default red delete-row fa fa-times" type="button"></i>')
        );
        return row;
    },
    updateTotal: function (ar, ele) {
        var tot = 0;
        for (var index = 0; index < ar.length; index++) {
            var element = ar[index];
            var val = parseFloat(element.innerHTML);
            tot += val;
        }
        var roundedTotal = Math.round(tot * 100) / 100;
        $('#' + ele).html(roundedTotal);
    },
    updateMacro: function (ar, multiplier, ca, ele) {
        var tot = 0;
        var cal = 0;
        //gets total nutient eg. fat, protein, carb
        for (var index = 0; index < ar.length; index++) {
            var element = ar[index];
            var val = parseFloat(element.innerHTML);
            tot += val;
        }
        //gets total calories
        for (var index = 0; index < ca.length; index++) {
            var element = ca[index];
            var val = parseFloat(element.innerHTML);
            cal += val;
        }
        try {
            var roundedTotal = Math.round(tot);
            var roundedCal = Math.round(cal);
            var roundedMacro = Math.round(((roundedTotal * multiplier) * 100) / roundedCal);
            $('#' + ele).html(roundedMacro);
        } catch (e) {
            alert('Error calculating Macro ' + e.message);
        }
    },
    unhideMeal: function (e) {
        //remove class hiding meal[i]
        var tbl = $('#meal' + e);
        tbl.removeClass('meal-empty');
    }
};

var autocomplete = {
    lookup: function (query, done) {
        callback.done = done; //put callback in global to call in response
        ipcRenderer.send('autocomplete-food-search', query);
    },
    onSelect: function (selected) {
        ipcRenderer.send('food-search-byId', selected.data);
    },
    textChange: () => {
        var el = $('.popover').fadeOut('fast', () => {
            $(this).remove();
        })
        localStorage.removeItem('food-item');
    }
}

//so listeners are only added once.
ipcRenderer.removeAllListeners('food-search-byId-result');
ipcRenderer.removeAllListeners('food-search-result');
//page events returns
ipcRenderer.on('food-search-byId-result', (event, foodItem) => {
    localStorage.setItem('food-item', JSON.stringify(foodItem));
    var el = $('#txtAutoComplete');

    var tbl = $(document.createElement("TABLE"));
    tbl.addClass('meal-popout');
    tbl.append($('<tr>').append(
        $('<td>').text('Calories'),
        $('<td id="popCal">').text(foodItem.calorie)));
    tbl.append($('<tr>').append(
        $('<td>').text('Protein'),
        $('<td id="popPro">').text(foodItem.protein)));
    tbl.append($('<tr>').append(
        $('<td>').text('Carbs'),
        $('<td id="popCarb">').text(foodItem.carb)));
    tbl.append($('<tr>').append(
        $('<td>').text('Fat'),
        $('<td id="popFat">').text(foodItem.fat)));
    el.popover('show');
    $('.popover-content').append(tbl);
    //set label serving type
    $('#servingSizeMeasurement').html(foodItem.serving + 's');
    $('#txtMulti').val('1');
    $('#txtComment').val(foodItem.comment);
})
//return for autocomplete server request
ipcRenderer.on('food-search-result', (event, foodItems) => {

    var suggestionArray = $.map(foodItems, function (i) {
        return { 'value': i.name, data: i._id }//map returned values for autocomplete
    });
    //make suggestion object
    var result = {
        suggestions: suggestionArray
    }
    //I know, ugly, but can't think of a 
    //better way for now :(  
    callback.done(result);
});