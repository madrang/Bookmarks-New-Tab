
$(document).ready(initApps);

function initApps()
{
	printApps();
}

function printApps()
{
	$('body div.apps').empty();
	$('body div.apps').append('<h2 class="appsHeader">Applications</h2>');
	
	var func = function(extensions) {
		for (var i in extensions) {
			if(extensions[i].isApp)
				$('body div.apps').append(printApplication(extensions[i]));
		}
	};
	
	chrome.management.getAll(func);
}

function printApplication(extInf)
{
	var item = $('<div id="' + extInf.id + '" class="app"></div>');
	
	var img = (extInf.icons) ?
		//App icon
		$('<img id="img_'+ extInf.id +'" src="' +
		((extInf.enabled) ?
			getBiggerImg(extInf.icons).url :
			' '
		) + '" width="128px" height="128px" alt="" />')
		//Default icon.
		: $('');
	
	item.append(img);
	item.append($('<a class="appLabel">' + extInf.name + '</a>'));
	
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
