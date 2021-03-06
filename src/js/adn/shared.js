/*******************************************************************************

    AdNauseam - Fight back against advertising surveillance.
    Copyright (C) 2014-2016 Daniel C. Howe

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/dhowe/AdNauseam
*/

// functions shared between addon and ui

'use strict';

/******************************* Polyfill ***********************************/

if (Array.prototype.contains instanceof Function === false) {

  Array.prototype.contains = function (a) {
    var b = this.length;
    while (b--) {
      if (this[b] === a) {
        return true;
      }
    }
    return false;
  };
}

if (String.prototype.startsWith instanceof Function === false) {
  String.prototype.startsWith = function (needle, pos) {
    if (typeof pos !== 'number') {
      pos = 0;
    }
    return this.lastIndexOf(needle, pos) === pos;
  };
}

if (String.prototype.endsWith instanceof Function === false) {
  String.prototype.endsWith = function (needle, pos) {
    if (typeof pos !== 'number') {
      pos = this.length;
    }
    pos -= needle.length;
    return this.indexOf(needle, pos) === pos;
  };
}

if (String.prototype.includes instanceof Function === false) {
  String.prototype.includes = function (needle, pos) {
    if (typeof pos !== 'number') {
      pos = 0;
    }
    if (start + search.length > this.length)
      return false;
    return this.indexOf(needle, pos) > -1;
  };
}


/**************************** Notifications *********************************/

var WARNING = 'warning', ERROR = 'error', INFO = 'info', SUCCESS = 'success', DNT = 'dnt',
  FAQ = 'https://github.com/dhowe/AdNauseam/wiki/FAQ', DNTFAQ = 'https://github.com/dhowe/AdNauseam/wiki/FAQ#what-is-the-effs-do-not-track-standard-and-how-it-is-supported-in-adnauseam';

var DNTAllowed = new Notification({
  isDNT: true,
  name: 'DNTAllowed',
  text: 'adnNotificationDNTAllowed',
});

var DNTHideNotClick = new Notification({
  isDNT: true,
  name: 'DNTHideNotClick',
  text: 'adnNotificationDNTHidingNotClicking',
});

var DNTClickNotHide = new Notification({
  isDNT: true,
  name: 'DNTClickNotHide',
  text: 'adnNotificationDNTClickingNotHiding',
  type: WARNING
});

var DNTNotify = new Notification({
  isDNT: true,
  name: 'DNTNotify',
  text: 'adnNotificationDNTJustSoYouKnow',
});

var HidingDisabled = new Notification({
  name: 'HidingDisabled',
  text: 'adnNotificationActivateHiding',
  prop: 'hidingAds',
  link: 'https://github.com/dhowe/AdNauseam/wiki/FAQ#how-does-adnauseam-hide-ads'
});

var ClickingDisabled = new Notification({
  name: 'ClickingDisabled',
  text: 'adnNotificationActivateClicking',
  prop: 'clickingAds',
  link: 'https://github.com/dhowe/AdNauseam/wiki/FAQ#how-does-adnauseam-click-ads'
});

var BlockingDisabled = new Notification({
  name: 'BlockingDisabled',
  text: 'adnNotificationActivateBlocking',
  prop: 'blockingMalware',
  link: 'https://github.com/dhowe/AdNauseam/wiki/FAQ#how-does-adnauseam-block-malicious-ads',
  type: ERROR
});

var EasyList = new Notification({
  name: 'EasyListDisabled',
  text: 'adnNotificationActivateEasyList',
  listUrl: 'assets/thirdparties/easylist-downloads.adblockplus.org/easylist.txt'
});
EasyList.func = reactivateList.bind(EasyList);

var AdBlockPlusEnabled = new Notification({
  name: 'AdBlockPlusEnabled',
  text: 'adnNotificationDisableAdBlockPlus',
  button: 'adnNotificationDisable',
  firstrun: true
});
AdBlockPlusEnabled.func = openExtPage.bind(AdBlockPlusEnabled);

var UBlockEnabled = new Notification({
  name: 'UBlockEnabled',
  text: 'adnNotificationDisableUBlock',
  button: 'adnNotificationDisable',
  firstrun: true
});
UBlockEnabled.func = openExtPage.bind(UBlockEnabled);

/***************************************************************************/

var Notifications = [AdBlockPlusEnabled, UBlockEnabled, HidingDisabled, ClickingDisabled, BlockingDisabled, EasyList, DNTAllowed, DNTHideNotClick, DNTClickNotHide, DNTNotify];

function Notification(m) {

  this.prop = opt(m, 'prop', '');
  this.name = opt(m, 'name', '');
  this.text = opt(m, 'text', '');
  this.link = opt(m, 'link', this.isDNT ? DNTFAQ : FAQ);

  this.isDNT = opt(m, 'isDNT', '');
  this.listUrl = opt(m, 'listUrl', '');
  this.expected = opt(m, 'expected', true);
  this.firstrun = opt(m, 'firstrun', false);

  this.type = opt(m, 'type', this.isDNT ? DNT : WARNING);
  this.button = opt(m, 'button', this.isDNT ? 'adnMenuSettings' : 'adnNotificationReactivate');

  // default function to be called on click
  this.func = opt(m, 'func', (this.isDNT ? openSettings : reactivateSetting).bind(this));
}

function opt(opts, name, def) {

  return opts && opts.hasOwnProperty(name) ? opts[name] : def;
}

var addNotification = function (notes, note) {

  for (var i = 0; i < notes.length; i++) {
    if (notes[i].name === note.name)
      return false;
  }
  notes.push(note);
  return true;
};

var removeNotification = function (notes, note) {

  for (var i = 0; i < notes.length; i++) {
    if (notes[i].name === note.name) {
      notes.splice(i, 1);
      return true;
    }
  }
  return false;
};

var renderNotifications = function (visibleNotes, thePage) {

  var page = thePage || 'menu',
    notifications = Notifications;

  if (page !== "menu")
    notifications = notifications.filter(function (n) {
      return !n.isDNT
    });

  if (page === "firstrun")
    notifications = notifications.filter(function (n) {
      return n.firstrun
    });

  var template = uDom('#notify-template');

  if (!template.length) throw Error('no template');

  for (var i = 0; i < notifications.length; i++) {

    var notify = notifications[i];

    var match = visibleNotes && visibleNotes.filter(function (n) {

      // console.log(notify.name, n.name);
      return notify.name === n.name;
    });

    var note = uDom('#' + notify.name),
      exists = note.length;

    if (match && match.length) {

      //console.log("MATCH: "+notify.name, match);
      if (exists)
        note.toggleClass('hide', false);
      else
        appendNotifyDiv(notify, template, uDom);

      if (notify.isDNT)
        modifyDNTNotifications()

    } else {

      exists && note.toggleClass('hide', true);
    }
  }
}

var hasNotification = function(notes, note){

   for (var i = 0; i < notes.length; i++) {
    if (notes[i].name === note.name) {
      return note;
    }
  }
  return false;
}

var hasDNTNotification = function(notes) {

  for (var i = 0; i < notes.length; i++) {
    if (notes[i].isDNT)
      return notes[i];
  }

  return false;
}


var appendNotifyDiv = function (notify, template) {

  var node = template.clone(false);

  node.addClass(notify.type);
  node.attr('id', notify.name);
  node.descendants('#notify-text').html("<span data-i18n='" + notify.text + "'></span>");
  node.descendants('#notify-button').attr('data-i18n', notify.button);
  node.descendants('#notify-link').attr('href', notify.link);

  // add click handler to reactivate button (a better way to do this??)
  uDom(node.nodes[0]).on('click', "#notify-button", function (e) {

    notify.func.apply(this); // calls reactivateSetting or reactivateList
  });
  uDom('#notifications').append(node);
  vAPI.i18n.render();
}


var modifyDNTNotifications = function () {

   var text = uDom('.notification.dnt #notify-text').nodes,
       link = uDom('.notification.dnt #notify-link').nodes,
       newlink = uDom('span>#notify-link').nodes;

   // console.log(text, link, newlink);
   if (text.length > 0 && link.length > 0 && newlink.length === 0) {
   var sections = text[0].innerHTML.split(','),
       newText = sections[0] + link[0].outerHTML + "," + sections[1];

   uDom('.notification.dnt #notify-text').html(newText);
   uDom('.notification.dnt>#notify-link').css('display', 'none');
 }
};

function reactivateSetting() {

  vAPI.messaging.send('dashboard', {

      what: 'userSettings',
      name: this.prop,
      value: this.expected
    }, reloadPane);
}

function reactivateList() {

  vAPI.messaging.send(
    'dashboard', {
      what: 'selectFilterLists',
      switches: [ { location: this.listUrl, off: false }]
    }, reloadPane);
}

function openPage(url){
    vAPI.messaging.send(
    'default', {
      what: 'gotoURL',
      details: {
        url: url,
        select: true,
        index: -1
      }
    }
  );
}

function openExtPage() {
  openPage(vAPI.extensionsPage);
}

function openSettings() {
  openPage('/dashboard.html#options.html');
}

function reloadPane() {

  if (window && window.location) {
    var pane = window.location.href;
    if (pane.indexOf('dashboard.html') > -1)
      window.location.reload();
  }
}

/****************************************************************************/

var rand = function (min, max) {

  if (arguments.length == 1) {
    max = min;
    min = 0;
  } else if (!arguments.length) {
    max = 1;
    min = 0;
  }

  return Math.floor(Math.random() * (max - min)) + min;
}

var setCost = function (numVisited) {

  //console.log('setCost: '+numVisited);

  var $west = uDom('#worth-estimate'),
    $cost = uDom('.cost');

  if (numVisited > 0) {
    $cost.removeClass('hidden');
    $west.text('= $' + (numVisited * 1.58).toFixed(2));
  } else {
    $cost.addClass('hidden');
  }
}

var arrayRemove = function (arr, obj) {

  var i = arr.indexOf(obj);
  if (i != -1) {
    arr.splice(i, 1);
    return true;
  }
  return false;
}

var trimChar = function (s, chr) {

  while (s.endsWith(chr)) {
    s = s.substring(0, s.length - chr.length);
  }

  return s;
}

var showAlert = function (msg) {

  if (msg) {

    $("#alert").removeClass('hide');
    $("#alert p").text(msg);

  } else {

    $("#alert").addClass('hide');
  }
}

var type = function (obj) { // from Angus Croll

  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

var getExportFileName = function () {

  return vAPI.i18n('adnExportedAdsFilename')
    .replace('{{datetime}}', new Date().toLocaleString())
    .replace(/[:/,]+/g, '.').replace(/ +/g, '');
}

var computeHash = function (ad) { // DO NOT MODIFY

  if (!ad) return;

  if (!ad.contentData || !ad.pageUrl) {
    console.error("Invalid Ad: no contentData || pageUrl", ad);
    return;
  }

  var hash = ad.pageDomain || ad.pageUrl, // change from pageUrl (4/3/16) ***
    // fall back to pageUrl if no pageDomain, for backward compatibility
    keys = Object.keys(ad.contentData).sort();

  for (var i = 0; i < keys.length; i++) {

    // fix to #445  (10/7/16)
    if (keys[i] != 'width' && keys[i] != 'height')
      hash += '::' + ad.contentData[keys[i]];
  }

  return YaMD5.hashStr(hash);
}

var byField = function (prop) {

  var sortOrder = 1;

  if (prop[0] === "-") {
    sortOrder = -1;
    prop = prop.substr(1);
  }

  return function (a, b) {
    var result = (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
    return result * sortOrder;
  };
}

var stringNotEmpty = function (s) {

  return typeof s === 'string' && s !== '';
};

/************************ URL utils *****************************/

var parseHostname = function (url) {

  return new URL(url).hostname;
}

// TODO: replace with core::domainFromURI?
var parseDomain = function (url, useLast) {

  var domains = decodeURIComponent(url).match(/https?:\/\/[^?\/]+/g);
  return domains.length ? new URL(
      useLast ? domains[domains.length - 1] : domains[0])
    .hostname : undefined;
}

/*
 * Start with resolvedTargetUrl if available, else use targetUrl
 * Then extract the last domain from the (possibly complex) url
 */
var targetDomain = function (ad) {

  var dom = parseDomain(ad.resolvedTargetUrl || ad.targetUrl, true);

  if (!dom) console.warn("Unable to parse domain: " + url);

  return dom;
}

/*** functions used to export/import/clear ads in vault.js and options.js ***/

var exportToFile = function () {

  vAPI.messaging.send('adnauseam', {
    what: 'exportAds',
    filename: getExportFileName()
  });
};

function handleImportFilePicker(evt) {

  var files = evt.target.files;
  var reader = new FileReader();

  reader.onload = function (e) {

    var adData;
    try {
      adData = JSON.parse(e.target.result);
    } catch (e) {
      postImportAlert({
        count: -1,
        error: e
      });
      return;
    }

    vAPI.messaging.send('adnauseam', {
      what: 'importAds',
      data: adData,
      file: files[0].name
    }, postImportAlert);
  }

  reader.readAsText(files[0]);
}

var postImportAlert = function (msg) {

  var text = msg.count > -1 ? msg.count : msg.error;
  vAPI.alert(vAPI.i18n('adnImportAlert')
    .replace('{{count}}', text));
};

var startImportFilePicker = function () {

  var input = document.getElementById('importFilePicker');
  // Reset to empty string, this will ensure an change event is properly
  // triggered if the user pick a file, even if it is the same as the last
  // one picked.
  input.value = '';
  input.click();
};

var clearAds = function () {

  var msg = vAPI.i18n('adnClearConfirm');
  var proceed = vAPI.confirm(msg);
  if (proceed) {
    vAPI.messaging.send('adnauseam', {
      what: 'clearAds'
    });
  }
};

/********* decode html entities in ads titles in vault and menu *********/

var decodeEntities = (function() {
  //from here: http://stackoverflow.com/a/9609450
  // this prevents any overhead from creating the object each time
  var element = document.createElement('div');
  function decodeHTMLEntities (str) {
    if(str && typeof str === 'string') {
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }
    return str;
  }
  return decodeHTMLEntities;
})();
