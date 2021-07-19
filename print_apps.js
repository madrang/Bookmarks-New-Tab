"use strict";

$(document).ready(initApps);

function initApps() {
    chrome.management.onInstalled.addListener(printApps);
    chrome.management.onUninstalled.addListener(printApps);
    chrome.management.onEnabled.addListener(printApps);
    chrome.management.onDisabled.addListener(printApps);

    printApps();
}

function printApps() {
    if (localStorage.hideApps == "true") {
        $("body div.dock-container").remove();
        return;
    }

    $("body div.dock-container").empty();
    $("body div.dock-container").show();

    // Add other menu items.
    /*
    const aboutItem = {
        id: "aboutlink",
        url: "about.html",
        icon: "images/About_White.png",
        title: "About"
    };
    addLink(aboutItem);
    */

    const OptionItem = {
        id: "optionlink",
        url: "options.html",
        icon: "images/Wrench_White.png",
        title: "Options"
    };
    addLink(OptionItem);

    //Add chrome extensions to dock.
    const func = function(extensions) {
        for (var i in extensions) {
            if(extensions[i].isApp) {
                $('body div.dock-container').append(addChromeExt(extensions[i]));
            }
        }
        $("#dock").Fisheye({
            maxWidth: 50
            , items: "a"
            , itemsText: "span"
            , container: ".dock-container"
            , itemWidth: 40
            , proximity: 90
            , halign : "center"
        });
    };
    chrome.management.getAll(func);
}

function addLink(node) {
    $('body div.dock-container').append(`<a class="dock-item" id="${node.id}" href="${node.url}"><img src="${node.icon}" /><span>${node.title}</span></a>`);
}

function addChromeExt(extInf) {
    const item = $(`<a id="${extInf.id}" class="dock-item"></a>`);
    let img;
    if(extInf.icons) {
        var extImgUrl = getBiggerImg(extInf.icons).url;
        if(!extInf.enabled) {
            extImgUrl = extImgUrl + '?grayscale=true';
        }
        img = $('<img id="img_'+ extInf.id +'" src="' + extImgUrl + '"/>');
    } else {
        //Default icon.
        img = $('');
    }

    item.append(img);
    item.append($(`<span>${extInf.name}</span>`));

    item.click({ ext: extInf }, function(e) {
        chrome.management.launchApp(e.data.ext.id);
    });

    return item;
}

function getBiggerImg(iconInfos) {
    let bestIcon = iconInfos[0];
    for (let i in iconInfos) {
        if(iconInfos[i].size > bestIcon.size)
            bestIcon = iconInfos[i];
    }
    return bestIcon;
}
