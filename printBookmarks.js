$(document).ready(initBookmarks);

(function ($) {
	$.jstree.plugin("dblClick", {
		__construct : function () { 
			//this.data.dblClick.DATA = $(); 
			
			this.get_container()
				.bind("dblclick.jstree", $.proxy(function (e) {
						this.do_action(e);
					}, this));
		},
		defaults : {
			Action : function(e){}
		},
		_fn : { 
			do_action : function (e) {
				this.get_settings(true).dblClick.Action(e);
			}
		}
	});
})(jQuery);

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

function initTrees()
{
	var ProgressiveRender = false;
	var ProgressiveUnload = false;
	
	localStorage.jsTree_theme = localStorage.jsTree_theme || "default";
	localStorage.jsTree_FaviconService = localStorage.jsTree_FaviconService || "chrome";
	
	jQuery.jstree.THEMES_DIR = "libs/jsTree/themes/";
	
	var plugins = [
		'core',
		"themes",
		"ui",
		"json",
		"state",
		"crrm",
		"contextmenu",
		"hotkeys",
		"dblClick"
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
				action: function (data) {
					var inst = $.jstree._reference(data.reference);
					var obj = inst.get_node(data.reference);
					var data = obj.data();
					
					if(data.chromeNode.url)
						location.href = data.chromeNode.url;
					},
					separator_before: true
			},
			openLinkNewTab: {
				label: "Open Link in New Tab",
				action: function (data) {
					var inst = $.jstree._reference(data.reference);
					var obj = inst.get_node(data.reference);
					var data = obj.data();
					
					if(data.chromeNode.url)
						window.open(data.chromeNode.url, '', '');
				}
			}
		}
	};
	
	var crrm = {
		move: {
			default_position: "first",
			check_move: function (m) {
				return (m.o[0].id === "thtml_1") ? false : true;
			}
		}
	};
	
	var dblClick = {
			Action: function(e) {
				if(e.target && e.target.href)
					location.href = e.target.href;
			}
	};
	
	$("body div.toolbar").jstree({
		json: {
			data: function(n, apply){
				if(n === -1) {
					chrome.bookmarks.getTree(function(bookmarksTree) {
						var TreeChildArray = [];
						TreeChildArray.push(nodeTojsTree(bookmarksTree[0].children[0]));
						apply.call(this, TreeChildArray);
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
				});
				*/
			},
			progressive_render: ProgressiveRender,
			progressive_unload: ProgressiveUnload
		},
		
		//Restore Node Open/Closed
		state: {
			key: "body div.toolbar:Tree"
		},
		
		crrm: crrm,
		contextmenu: contextmenu,
		dblClick: dblClick,
		themes: themes,
		plugins: plugins
	});
	
	$("body div.other").jstree({
		//Node Data
		json: {
			data: function(n, apply){
				if(n === -1) {
					chrome.bookmarks.getTree(function(bookmarksTree) {
						var TreeChildArray = [];
						TreeChildArray.push(nodeTojsTree(bookmarksTree[0].children[1]));
						apply.call(this, TreeChildArray);
					});
					return;
				}
			},
			progressive_render: ProgressiveRender,
			progressive_unload: ProgressiveUnload
		},
		
		//Restore Node Open/Closed
		state: {
			key: "body div.other:Tree"
		},
		
		crrm: crrm,
		contextmenu: contextmenu,
		dblClick: dblClick,
		themes: themes,
		plugins: plugins
	});
}

/* Favicon Service
 * 
 * http://g.etfv.co/
 * */

function nodeTojsTree(node)
{
	var treeNode = {
			title: (node.title != "") ? node.title : node.url,
			data: {
				jstree: {
					//closed: true
					//icon:false
				},
				chromeNode: node
			},
			li_attr: { id: "li.node.id" + node.id },
			a_attr: {}
		};
	
	//If url is NULL or missing, it is a folder.
	if (node.url) {
		switch(localStorage.jsTree_FaviconService) {
		case "chrome":
			treeNode.data.jstree.icon = "chrome://favicon/" + node.url;
			break;
		case "google":
			treeNode.data.jstree.icon = "http://www.google.com/s2/favicons?domain=" + node.url;
			break;
		default:
			treeNode.data.jstree.icon = localStorage.jsTree_FaviconService + node.url;
			break;
		}
		treeNode.a_attr.href = node.url;
		return treeNode;
	}
	
	var childs;
	treeNode.data.jstree.children = [];
	
	if (node.children) {
		childs = node.children;
	}
	/* else {
		var onChild = function(result){
			childs = result;
		};
		chrome.bookmarks.getChildren(node.id, onChild);
	}
	*/
	
	for (var i in childs) {
		treeNode.data.jstree.children.push(nodeTojsTree(childs[i]));
	}
	
	return treeNode;
}


// From before JsTree NOT USED ANYMORE.
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
