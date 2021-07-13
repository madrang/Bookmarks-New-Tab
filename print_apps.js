$(document).ready(initApps);

function initApps()
{
	chrome.management.onInstalled.addListener(printApps);
	chrome.management.onUninstalled.addListener(printApps);
	chrome.management.onEnabled.addListener(printApps);
	chrome.management.onDisabled.addListener(printApps);
	
	printApps();
}

function printApps()
{
	if (localStorage.hideApps == "true") {
		$('body div.dock-container').remove();
		return;
	}
	
	$('body div.dock-container').empty();
	$('body div.dock-container').show();

	// Add other menu items.
	/*
	var AboutItem = {
		Id: "aboutlink",
		Url: "about.html",
		Icon: "images/About_White.png",
		Title: "About"
	};
	addLink(AboutItem);
	*/
	
	var OptionItem = {
		Id: "optionlink",
		Url: "options.html",
		Icon: "images/Wrench_White.png",
		Title: "Options"
	};
	addLink(OptionItem);

	//Add chrome extensions to dock.
	var func = function(extensions) {
		for (var i in extensions) {
			if(extensions[i].isApp)
				$('body div.dock-container').append(addChromeExt(extensions[i]));
		}
		
		$('#dock').Fisheye(
			{
				maxWidth: 50,
				items: 'a',
				itemsText: 'span',
				container: '.dock-container',
				itemWidth: 40,
				proximity: 90,
				halign : 'center'
			}
		)
	};
	chrome.management.getAll(func);
}

function addLink(node)
{
	$('body div.dock-container').append('<a class="dock-item" id="' + node.Id + '" href="' + node.Url + '">' +
		'<img src="' + node.Icon + '" />' +
		'<span>' + node.Title + '</span>' +
		'</a>');
}

function addChromeExt(extInf)
{
	var item = $('<a id="' + extInf.id + '" class="dock-item"></a>');
	
	var img;
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
	item.append($('<span>' + extInf.name + '</span>'));
	
	item.click({ ext: extInf }, function(e) {
		chrome.management.launchApp(e.data.ext.id);
	});
	
	return item;
}

function getBiggerImg(iconInfos)
{
	var bestIcon = iconInfos[0];
	for (var i in iconInfos) {
		if(iconInfos[i].size > bestIcon.size)
			bestIcon = iconInfos[i];
	}
	return bestIcon;
}
