'use strict';
const Almond = require('./almond');

const almond = new Almond(require('./config'));

almond.on('message', data => {
    if (data.commandtype === 'devicelist') {
        const devices = data.data;
        Object.keys(devices).forEach(k => console.log(`Found Device: ${devices[k].devicename}`));
    }
});

almond.send({ mii: 1, cmd: 'devicelist' });
almond.send({ MobileInternalIndex: 1, CommandType: 'ClientList' });
