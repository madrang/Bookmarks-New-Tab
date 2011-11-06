$(document).ready(initBookmarks);

(function ($) {
	$.jstree.plugin("dblClick", {
		__construct : function () { 
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

var refreshEnabled = true;

function initBookmarks()
{
	var refreshTree = function(){
		if(refreshEnabled) {
			$(".jstree").jstree("refresh");
		}
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
	
	var treeSetup = {
		json: {
			progressive_render: ProgressiveRender,
			progressive_unload: ProgressiveUnload
		},
		
		contextmenu: {
			select_node: true,
			show_at_node: false,
			
			items:{
				create: {
					separator_before: false,
					separator_after: true,
					
					icon: false,
					label: "Create",
					action: function (data) { }
				},
				rename: {
					separator_before: false,
					separator_after: false,
					
					icon: false,
					label: "Rename",
					action: function (data) {
						var inst = $.jstree._reference(data.reference);
						var obj = inst.get_node(data.reference);
						var nodeData = obj.data();
						invoke(function() {
							var name = prompt("Bookmark title", nodeData.chromeNode.title);
							if (name != null && name != "") {
								inst.rename_node(obj, name);
							}
						});
					}
				},
				remove: {
					separator_before: false,
					separator_after: false,
					
					icon: false,
					label: "Delete",
					action: function (data) {
						var inst = $.jstree._reference(data.reference);
						var obj = inst.get_node(data.reference);
						var nodeData = obj.data();
						
						if (nodeData.chromeNode.children) {
							invoke(function()
							{
								if (confirm("Delete folder?"))
									inst.delete_node(obj);
							});
						} else inst.delete_node(obj);
					}
				},
				ccp: {
					separator_before: true,
					separator_after: false,
					
					icon: false,
					label: "Edit",
					action: false,
					
					submenu: { 
						cut: {
							separator_before: false,
							separator_after: false,
							
							icon: false,
							label: "Cut",
							action: function (data) { }
						},
						copy: {
							separator_before: false,
							separator_after: false,
							
							icon: false,
							label: "Copy",
							action: function (data) { }
						},
						paste: {
							separator_before: false,
							separator_after: false,
							
							icon: false,
							label: "Paste",
							action: function (data) { }
						}
					}
				},
				openLink: {
					separator_before: false,
					separator_after: false,
					
					icon: false,
					label: "Open Link",
					action: function (data) {
						var inst = $.jstree._reference(data.reference);
						var obj = inst.get_node(data.reference);
						var nodeData = obj.data();
						
						if(nodeData.chromeNode.url)
							location.href = nodeData.chromeNode.url;
						},
						separator_before: true
				},
				openLinkNewTab: {
					separator_before: false,
					separator_after: false,
					
					icon: false,
					label: "Open Link in New Tab",
					action: function (data) {
						var inst = $.jstree._reference(data.reference);
						var obj = inst.get_node(data.reference);
						var nodeData = obj.data();
						
						if(nodeData.chromeNode.url)
							window.open(nodeData.chromeNode.url, '', '');
					}
				}
			}
		},
		dblClick: {
			Action: function(e) {
				if(e.target && e.target.href)
					location.href = e.target.href;
			}
		},
		
		themes: {
			theme: localStorage.jsTree_theme
		},
		
		plugins: [
			'core',
			"themes",
			"ui",
			
			"json",
			"state",
			
			"contextmenu",
			
			"hotkeys",
			"dnd",
			
			"dblClick"
		]
	};
	
	var renameNode = function (e, data) {
		var nodeData = data.rslt.obj.data();
		var changes = {
			title: data.rslt.title
		};
		refreshEnabled = false;
		chrome.bookmarks.update(nodeData.chromeNode.id, changes, function(){ refreshEnabled = true; });
	};
	
	var deleteNode = function (e, data) {
		var nodeData = data.rslt.obj.data();
		refreshEnabled = false;
		
		var enableRefresh = function() { refreshEnabled = true; };
		if (nodeData.chromeNode.children)
			chrome.bookmarks.removeTree(nodeData.chromeNode.id, enableRefresh);
		else
			chrome.bookmarks.remove(nodeData.chromeNode.id, enableRefresh);
	};
	
	/*--- Bookmarks toolbar ---*/
	var bookmarksToolbar = $("body div.bookmarks-toolbar");
	var toolSetup = {
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
			}
		},
		
		//Restore Node Open/Closed
		state: {
			key: "body div.bookmarks-toolbar:Tree"
		}
	};
	bookmarksToolbar.jstree($.extend(true, {}, treeSetup, toolSetup));
	bookmarksToolbar.bind("rename_node.jstree", renameNode);
	bookmarksToolbar.bind("delete_node.jstree", deleteNode);
	
	
	/*--- Other bookmarks ---*/
	var otherBookmarks = $("body div.other-bookmarks");
	var otherSetup = {
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
			}
		},
		
		//Restore Node Open/Closed
		state: {
			key: "body div.other-bookmarks:Tree"
		}
	};
	otherBookmarks.jstree($.extend(true, {}, treeSetup, otherSetup));
	otherBookmarks.bind("rename_node.jstree", renameNode);
	otherBookmarks.bind("delete_node.jstree", deleteNode);
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
	} else {
		var childs;
		treeNode.data.jstree.children = [];
		
		var addChild = function(childs){
			for (var i in childs) {
				treeNode.data.jstree.children.push(nodeTojsTree(childs[i]));
			}
		};
		
		if (node.children) {
			addChild(node.children);
		} else {
			chrome.bookmarks.getChildren(node.id, addChild);
		}
	}
	
	return treeNode;
}

function invoke(e) { window.setTimeout(e, 1); }

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
