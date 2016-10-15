const fs = require('fs');
const path = `${__dirname}/`;

module.exports = {
    user: function () {
        var userString = fs.readFileSync(path + 'user.json', 'utf8');
        return JSON.parse(userString);
    }
};

