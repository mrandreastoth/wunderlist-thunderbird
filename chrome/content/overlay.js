/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Created by Nicolas Arnaud-Cormos <nicolas.arnaudcormos@gmail.com>
 * Based on the work from Izidor Matušov <izidor.matusov@gmail.com> (GTG Task Button)
 */

/*
 * trims whitespace, reduces inner newlines and spaces
 */
function trim(string, length) {
    // get rid of stacked newlines
    string = (string || '').replace(/\n{3,}/g, '\n\n');

    // get rid of redonk spaces
    string = string.replace(/\s{3,}/g, ' ');
    string = string.replace(/^\s+/g,'').replace(/\s+$/g,'');

    // only trim string length if it's
    if (string.length > length) {
        string = string.substring(0, length) + '...';
    } 

    return string;
}


var wunderlist_thunderbird = {
    /*
     * Create a new task, using title, author, recipients and content
     */
    createTask: function (event) {
        var message = gFolderDisplay.selectedMessage;
        var messenger = Components.classes["@mozilla.org/messenger;1"]
                                   .createInstance(Components.interfaces.nsIMessenger);
        var listener = Components.classes["@mozilla.org/network/sync-stream-listener;1"]
                                  .createInstance(Components.interfaces.nsISyncStreamListener);

        var uri = message.folder.getUriForMsg(message);
        messenger.messageServiceFromURI(uri).streamMessage(uri, listener, null, null, false, "");
        var folder = message.folder;

        var title = trim(message.mime2DecodedSubject, 150) + " #mail";
        var author = "From: " + message.mime2DecodedAuthor + "\n";
        var recipients = "To: " + message.mime2DecodedRecipients + "\n\n";
        var content = folder.getMsgTextFromStream(listener.inputStream, message.Charset,
                              65536, 32768, false, true, { });

        title = encodeURIComponent(title);
        content = encodeURIComponent(author + recipients + trim(content, 5000));

        var extProtocolSvc = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
                                  .getService(Components.interfaces.nsIExternalProtocolService);
        var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                             .getService(Components.interfaces.nsIIOService);
        var wunderlisturi = ioService.newURI('https://www.wunderlist.com/#/extension/add/' 
                             + title + '/' + content, null, null);
        extProtocolSvc.loadUrl(wunderlisturi);

        RestoreFocusAfterHdrButton();
    },

    /*
     * Add our button to toolbar during the first load
     */
    initButton: function () {
        // create object for accessing preferencies for this extension
        var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                            .getService(Components.interfaces.nsIPrefService)
                            .getBranch("extensions.wunderlist.");
                    
        if (prefs.getBoolPref("firstRun")) {
            var button = 'wunderlist-button';
            var after = 'hdrArchiveButton';
            var toolbar = 'header-view-toolbar';
            var currentset = document.getElementById(toolbar).currentSet;

            pos = currentset.indexOf(after)
            if (after !== "" && pos >= 0) {
                pos += after.length;
                currentset = currentset.substr(0, pos) + "," + button + currentset.substr(pos, currentset.length);
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

}

// add the button only when thunderbird is fully loaded
addEventListener('load', wunderlist_thunderbird.initButton, false);

