$(document).ready(initBookmarks);

var NodeIdREG = /^li.node.id(\d+)/;

function initBookmarks()
{
	var refreshTree = function(){
		$(".jstree").jstree("refresh");
	};
	
	// If something happend Refresh the Trees
	chrome.bookmarks.onChanged.addListener(refreshTree);
	chrome.bookmarks.onChildrenReordered.addListener(refreshTree);
	chrome.bookmarks.onCreated.addListener(refreshTree);
	chrome.bookmarks.onImportEnded.addListener(refreshTree);
	chrome.bookmarks.onMoved.addListener(refreshTree);
	chrome.bookmarks.onRemoved.addListener(refreshTree);
	
	initTrees();
}

	// Traverse the bookmark tree, and print the folder and nodes.
function initTrees()
{
	localStorage.jsTree_theme = localStorage.jsTree_theme || "default";
	jQuery.jstree.THEMES_DIR = "libs/jsTree/themes/";
	
	var plugins = [
		"themes",
		"json_data",
		"localStorage",
		"crrm",
		"contextmenu",
		"ui",
		"hotkeys"
	];
	
	var themes = {
			theme: localStorage.jsTree_theme
	};
	
	var contextmenu = {
		select_node: true,
		show_at_node: false,
		items:{
			openLink: {
				label: "Open Link",
				action: function (node) {
					var match = NodeIdREG.exec(node[0].id)
						if(!(match && match[1]))
							return;
						
						chrome.bookmarks.get(match[1], function(result){
							if(result[0].url)
								location.href = result[0].url;
						});
					},
					separator_before: true
				},
				openLinkNewTab: {
					label: "Open Link in New Tab",
					action: function (node) {
						var match = NodeIdREG.exec(node[0].id)
						if(!(match && match[1]))
							return;
						
						chrome.bookmarks.get(match[1], function(result){
							if(result[0].url)
								window.open(result[0].url, '', '');
					});
				}
				
			}
		}
	};
	
	$("body div.toolbar").jstree({
		json_data: {
			data: function(n, apply){
				if(n === -1) {
					chrome.bookmarks.getTree(function(bookmarksTree) {
						apply(nodeTojsTree(bookmarksTree[0].children[0]));
					});
					return;
				}
				/*
				var idArray = [];
				for(i in n) {
					var match = NodeIdREG.exec(n[i].id)
					if(match && match[1])
						idArray.push(match[1]);
				}
				var complete = false;
				var nodeArr = [];
				chrome.bookmarks.get(idArray, function(results){
						for(i in results)
							nodeArr.push(nodeTojsTree(results[i]));
						complete = true;
				});
				
				while(!complete){}
				apply(nodeArr);
				*/
			},
			progressive_render: true
			//progressive_unload: true
		},
		
		/*crrm: {
			move: {
				default_position: "first",
				check_move: function (m) {
						return (m.o[0].id === "thtml_1") ? false : true;
				}
			}
		},*/
		
		localStorage: {
			save_loaded: "body div.toolbar:loaded",
			save_opened: "body div.toolbar:opened",
			save_selected: "body div.toolbar:selected"
		},
		
		contextmenu: contextmenu,
		themes: themes,
		plugins: plugins
	});
	
	$("body div.other").jstree({
		//Node Data
		json_data: {
			data: function(n, apply){
				if(n === -1) {
					chrome.bookmarks.getTree(function(bookmarksTree) {
						apply(nodeTojsTree(bookmarksTree[0].children[1]));
					});
					return;
				}
			},
			progressive_render: true
		},
		
		//Restore Node Open/Closed
		localStorage: {
			save_loaded: "body div.other:loaded",
			save_opened: "body div.other:opened",
			save_selected: "body div.other:selected"
		},
		
		contextmenu: contextmenu,
		themes: themes,
		plugins: plugins
	});
}

function nodeTojsTree(node)
{
	var treeNode = {
			attr: { id: "li.node.id" + node.id },
			data: {
				title: node.title,
				attr: { }
			}
		};
	
	//If url is NULL or missing, it is a folder.
	if (node.url) {
		treeNode.data.icon = "chrome://favicon/" + node.url;
		treeNode.data.attr.href = node.url;
		return treeNode;
	}
	
	treeNode.children = [];
	var childs;
	
	if (node.children) {
		childs = node.children;
	}
	/* else {
		var complete;
		var onChild = function(result){
			childs = result;
			complete = true;
		};
		chrome.bookmarks.getChildren(node.id, onChild);
		while(!complete){}
	}
	*/
	
	for (var i in childs) {
		treeNode.children.push(nodeTojsTree(childs[i]));
	}
	
	return treeNode;
}

function removeBookmark(e)
{	
	if (e.data.node.children)
	{
		if (confirm("Delete folder?"))
		{
			chrome.bookmarks.removeTree(e.data.node.id);
			$('ul#folder' + e.data.node.id).remove();
			
		} else return false;
		
	} else chrome.bookmarks.remove(e.data.node.id);
	
	$('li#' + e.data.node.id).remove();
	$('li#edit' + e.data.node.id).remove();
}

function saveEdit(e)
{
	var changes = new Object();
	
	changes.title = $('li#edit' + e.data.node.id + ' input[name=title]').val();
	$('li#' + e.data.node.id + ' span.title').html( changes.title );
	
	if (!e.data.node.children)
	{
		var url = $('li#edit' + e.data.node.id + ' input[name=url]').val();
		if (!url.match(/^https?:\/\//)) url = 'http://' + url;
		changes.url = url;
		$('li#' + e.data.node.id + ' a:first').attr('href', url);
	}
		
	chrome.bookmarks.update(e.data.node.id, changes);
	
	$('li#edit' + e.data.node.id).remove();
}

function doAdd(e)
{
	var newBookmark = new Object();
	
	newBookmark.parentId = e.data.node.id;
	
	newBookmark.title = $('li#add' + e.data.node.id + ' input[name=title]').val();
	//$('li#' + e.data.node.id + ' span.title').html( newBookmark.title );
	
	var url = $('li#add' + e.data.node.id + ' input[name=url]').val();
	if (!url.match(/^https?:\/\//)) url = 'http://' + url;
	newBookmark.url = url;
	//$('li#' + e.data.node.id + ' a:first').attr('href', url);
	
	chrome.bookmarks.create(newBookmark);
	
	$('li#add' + e.data.node.id).remove();
	
	printBookmarks();
}
