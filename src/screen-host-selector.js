/* global module */

var UI = require('ui');
var Settings = require('settings');

var mixpanel = require('./mixpanel');
var lib = require('./lib');

var screen;

function getHostsForMenu() {
    var hosts = Settings.option('hosts') || [];
    return hosts.map(function(host, index) {
        return {
            title: host.name,
            subtitle: host.address + (host.username && host.password ? ' (auth)' : '')
        };
    });
}

module.exports.updateHostList = function() {
    if (!screen) {
        return;
    }

    screen.items(0, getHostsForMenu());
};

module.exports.screen = function() {
    if (!screen) {
        screen = new UI.Menu({
            fullscreen: true,
            backgroundColor: lib.getWatchInfo().platform === 'aplite' ? '#000000' : '#00aaff',
            textColor: '#FFFFFF',
            highlightBackgroundColor: '#FFFFFF',
            highlightTextColor: lib.getWatchInfo().platform === 'aplite' ? '#000000' : '#00aaff',
            sections: [{
                title: 'Choose a Kodi host',
                items: getHostsForMenu()
            }]
        });
        screen.on('select', function(event) {
            if (!event.item) {
                return;
            }

            var oldHost = Settings.data('activeHost');
            var newHost = Settings.option('hosts')[event.itemIndex];
            Settings.data('activeHost', newHost);
            Settings.data('activeHostIndex', event.itemIndex);
            require('./handler-main').reset();
            require('./handler-main').updatePlayerState();
            require('./screen-func-selector').screen().hide();
            screen.hide();

            mixpanel.track('Host Selector, Selected host', {
                hosts: Settings.option('hosts'),
                kodiIpOld: oldHost && oldHost.address,
                kodiIp: newHost.address,
                usingAuth: !!(newHost.username && newHost.password),
                itemIndex: event.itemIndex,
                hostCount: Settings.option('hosts').length
            });
        });
        screen.on('show', function(event) {
            var hosts = Settings.option('hosts') || [];
            if (hosts.length  && Settings.data('activeHostIndex') !== undefined && hosts.length > Settings.data('activeHostIndex')) {
                screen.selection(0, Settings.data('activeHostIndex'));
            }
            mixpanel.track('Host Selector viewed', {
                hosts: Settings.option('hosts'),
                kodiIp: Settings.data('activeHost') && Settings.data('activeHost').address
            });
        });
        screen.on('hide', function(event) {
            mixpanel.track('Host Selector hidden');
        });
    }
    return screen;
};
