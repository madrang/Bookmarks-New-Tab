
$(document).ready(initApps);

function initApps()
{
	printApps();
}

function printApps()
{
	$('body div.dock-container').empty();
	
	// Add other menu items.
	$('body div.dock-container').append('<a class="dock-item" id="optionlink" href="options.html">' +
		'<img src="images/Wrench_White.png" alt="home" />' +
		'<span>Options</span>' +
		'</a>');
	
	var func = function(extensions) {
		for (var i in extensions) {
			if(extensions[i].isApp)
				$('body div.dock-container').append(builDockItem(extensions[i]));
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

function builDockItem(extInf)
{
	var item = $('<a id="' + extInf.id + '" class="dock-item"></a>');
	
	//App icon
	var img = (extInf.icons) ?
		//(extInf.enabled) is false dim im gray.
		$('<img id="img_'+ extInf.id +'" src="' + getBiggerImg(extInf.icons).url + '"/>')
		//Default icon.
		: $('');
	
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
