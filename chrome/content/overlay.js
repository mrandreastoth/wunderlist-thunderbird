/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Created by Nicolas Arnaud-Cormos <nicolas.arnaudcormos@gmail.com>
 * Based on the work from Izidor Matušov <izidor.matusov@gmail.com> (GTG Task Button)
 */


(function(window) {
    // Config options for this addon
    var config = {
        'addUrl' : 'https://www.wunderlist.com/#/extension/add/'
    }

    // Get preferences for this addon
    var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService)
                          .getBranch("extensions.wunderlist.");

    /*
     * Trims whitespace, reduces inner newlines and spaces
     */
    function trim(string, length) {
        // get rid of stacked newlines
        string = (string || '').replace(/\n{3,}/g, '\n\n');

        // get rid of redondant spaces
        string = string.replace(/\s{3,}/g, ' ');
        string = string.replace(/^\s+/g,'').replace(/\s+$/g,'');

        // only trim string length if it's
        if (string.length > length) 
            string = string.substring(0, length) + '...';

        return string;
    }

    /*
     * Create a new task, using title, author, recipients and content
     */
    function createTask(event) {
        var message = gFolderDisplay.selectedMessage;
        var messenger = Components.classes["@mozilla.org/messenger;1"]
                                  .createInstance(Components.interfaces.nsIMessenger);
        var listener = Components.classes["@mozilla.org/network/sync-stream-listener;1"]
                                 .createInstance(Components.interfaces.nsISyncStreamListener);

        var folder = message.folder;
        var uri = folder.getUriForMsg(message);
        messenger.messageServiceFromURI(uri).streamMessage(uri, listener, null, null, false, "");

        // Get title, author, recipients and message
        var title = trim(message.mime2DecodedSubject, 150) + " #mail";
        var author = "From: " + message.mime2DecodedAuthor + "\n";
        var recipients = "To: " + message.mime2DecodedRecipients + "\n\n";
        var content = folder.getMsgTextFromStream(listener.inputStream, message.Charset,
                              65536, 32768, false, true, { });

        title = encodeURIComponent(title);
        content = encodeURIComponent(author + recipients + trim(content, 5000));

        // Open web page with Wunderlist add url
        var extProtocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                                  .getService(Components.interfaces.nsIExternalProtocolService);
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                             .getService(Components.interfaces.nsIIOService);
        var wunderlistUrl = ioService.newURI(config.addUrl 
                             + title + '/' + content, null, null);
        extProtocolSvc.loadUrl(wunderlistUrl);

        RestoreFocusAfterHdrButton();
    }

    /*
     * Add our button to toolbar during the first load
     * The button will be on the right of archive
     */
    function initButton() {
        if (prefs.getBoolPref("firstRun")) {
            var button = 'wunderlist-button';
            var after = 'hdrArchiveButton';
            var toolbar = 'header-view-toolbar';
            var currentset = document.getElementById(toolbar).currentSet;

            pos = currentset.indexOf(after)
            if (after !== "" && pos >= 0) {
                pos += after.length;
                currentset = currentset.substr(0, pos) + "," 
                             + button + currentset.substr(pos, currentset.length);
            }
            else {
                currentset = currentset + "," + button;
            }

            document.getElementById(toolbar).setAttribute("currentset", currentset);
            document.getElementById(toolbar).currentSet = currentset;
            document.persist(toolbar, "currentset");
            prefs.setBoolPref("firstRun", false);
        }
    }

    // add the button only when thunderbird is fully loaded
    addEventListener('load', initButton, false);

    // exports
    window.createTask = createTask;
})(window)


