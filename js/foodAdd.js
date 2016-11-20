$(document).ready(function () {
    $("#btnAddFood").off('click').click(actions.addItem);
    $('#txtAutoComplete').autocomplete({
        lookup: autocomplete.lookup,
        onSelect: autocomplete.onSelect
    });
    var el = $('#txtAutoComplete');
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
        var meal = $('#ddlMealNumber').val();
        var userSelectedValue = parseInt($('#txtMulti').val());
        //if not a number or less than 1, return 1
        var multiplier = !isNaN(userSelectedValue) && userSelectedValue > 0 ? userSelectedValue : 1; 
        //add item to specific grid 
        grid.addRow(item, meal, multiplier);
        //remove had class if neccessary
        grid.unhideMeal(meal);
    }
};

var grid = {
    addRow: function (a, b, c) {
        //get table body to append a new row
        var table = $('#tbl' + b + ' > tbody:last-child');
        //create row from dropdown selection
        var row = grid.generateRow(a, c);
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
    },
    generateRow: function (data, multiplier) {
        var row = $('<tr>').append(
            $('<td>').text(data.name),
            $('<td>').text(data.category),
            $('<td class="cal">').text(data.calories * multiplier),
            $('<td class="fat">').text(data.fat * multiplier),
            $('<td class="carb">').text(data.carb * multiplier),
            $('<td class="pro">').text(data.protein * multiplier)
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
        $('<td>').text('Protein'),
        $('<td>').text(foodItem.protein))); 
    tbl.append($('<tr>').append(
        $('<td>').text('Fat'),
        $('<td>').text(foodItem.fat))); 
    tbl.append($('<tr>').append(
        $('<td>').text('Calories'),
        $('<td>').text(foodItem.calories))); 
    tbl.append($('<tr>').append(
        $('<td>').text('Carbs'),
        $('<td>').text(foodItem.carb)));
 
    el.popover('show');
    $('.popover-content').append(tbl);
    // setTimeout(function () {
    //     el.popover('hide');
    // }, 5000);
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