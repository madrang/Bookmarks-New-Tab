"use strict";

$(document).ready(initBookmarks);

jQuery.fn.extend({
    live: function (event, callback) {
       if (this.selector) {
            jQuery(document).on(event, this.selector, callback);
        }
        return this;
    }
});

const BUTTON_OK = "Ok";
const BUTTON_CANCEL = "Cancel";

function showPrompt(params = {}) {
    const getInputsFields = function() {
        const inputsElements = $("#dialog").find("input").get();
        return inputsElements.reduce((accumulator, element) => {
            accumulator[element.name || element.id] = $(element).val()
            return accumulator;
        }, {});
    };
    $("#dialog").empty();
    $("#dialog").html(params.html);
    let wasResolved = false;
    return new Promise(function (resolve, reject) {
        const dialog = $("#dialog").dialog({
            modal: true
            , resizable: false

            , title: params.title || "Error: Missing Dialog Title!"
            , buttons: [{
                text: "Ok"
                , icon: "ui-icon-check"
                , click: function() {
                    wasResolved = true;
                    resolve({
                        button: BUTTON_OK
                        , inputs: getInputsFields()
                    });
                    $(this).dialog("close");
                }
                //showText: false
            }, {
                text: "Cancel"
                , icon: "ui-icon-cancel"
                , click: function() {
                    wasResolved = true;
                    resolve({
                        button: BUTTON_CANCEL
                        , inputs: getInputsFields()
                    });
                    $(this).dialog("close");
                }
                //showText: false
            }]
            , open: function(event, ui) {
                // Center the dialog within the viewport (i.e. visible area of the screen)
                let top = Math.max(window.scrollY + window.innerHeight / 2 - jQuery(this)[0].offsetHeight / 2, 0);
                let left = Math.max(window.innerWidth / 2 - jQuery(this)[0].offsetWidth / 2, 0);
                jQuery(this).parent().css("top", top + "px");
                jQuery(this).parent().css("left", left + "px");
            }
            , close: function( event, ui ) {
                if (wasResolved) {
                    return;
                }
                resolve({
                    button: null
                    , inputs: []
                });
            }
        });
        $("#dialog").dialog("open");
    });
}

let refreshEnabled = true;
function initBookmarks() {
    // If something happend Refresh the Trees
    chrome.bookmarks.onChanged.addListener(refreshTree);
    chrome.bookmarks.onChildrenReordered.addListener(refreshTree);
    chrome.bookmarks.onCreated.addListener(refreshTree);
    chrome.bookmarks.onImportEnded.addListener(refreshTree);
    chrome.bookmarks.onMoved.addListener(refreshTree);
    chrome.bookmarks.onRemoved.addListener(refreshTree);

    //Check settings.
    localStorage.jsTree_theme = localStorage.jsTree_theme || "default";
    localStorage.jsTree_FaviconService = localStorage.jsTree_FaviconService || "chrome";

    const jQuery_ui_styleSheet = window.document.createElement("link");
    jQuery_ui_styleSheet.type = "text/css"
    jQuery_ui_styleSheet.rel = "stylesheet";
    jQuery_ui_styleSheet.href = `/libs/ui-theme/${localStorage.jsTree_theme}/jquery-ui.min.css`;
    window.document.head.appendChild(jQuery_ui_styleSheet);

    // Common settings for both trees.
    const treeSetup = {
        core: {
            themes: {
                name: localStorage.jsTree_theme
                , dots: Boolean(window.localStorage.getItem("jsTree_themeDots"))
                , stripes: Boolean(window.localStorage.getItem("jsTree_themeStripes"))
                // Set theme path.
                , url: `/libs/jstree/themes/${localStorage.jsTree_theme}/style.css`
            }
            , check_callback: function (operation, node, parent, position, more) {
                const inst = $.jstree.reference(node);
                node = inst.get_node(node);
                const nodeData = node.data;
                switch(operation) {
                    case "create_node":
                        break;
                    case "rename_node":
                        break;
                    case "move_node":
                        if(typeof more === "object" && more.dnd && typeof more.ref === "object") {
                            if(more.pos === "i" && more.ref.data.chromeNode.url) {
                                // Dont allow moving inside a bookmark
                                return false;
                            }
                        }
                        break;
                    case "copy_node":
                        break;
                    case "delete_node":
                        break;
                    }
                return true;
            }
        }
        , conditionalselect: function (node, event) {
            return true;
        }
        , contextmenu: {
            select_node: true
            , show_at_node: false

            , items: {
                create: {
                    separator_before: false
                    , separator_after: true

                    , icon: false
                    , label: "Create"
                    , action: function (data) {
                        const inst = $.jstree.reference(data.reference);
                        const obj = inst.get_node(data.reference);
                        const nodeData = obj.data;

                        const create = function(params) {
                            if(typeof params !== "object" || params.button !== BUTTON_OK) {
                                return;
                            }
                            const inputs = params.inputs;
                            if(inputs.newTitle == null || inputs.newTitle == "") {
                                return;
                            }

                            const newBookmark = {
                                title: inputs.newTitle
                            };

                            if(nodeData.chromeNode.url) {
                                newBookmark.parentId = nodeData.chromeNode.parentId;
                            } else {
                                newBookmark.parentId = nodeData.chromeNode.id;
                            }

                            if(inputs.newUrl != null && inputs.newUrl != "") {
                                newBookmark.url = normalizeUrl(inputs.newUrl);
                            }

                            /* Replace refreshTree by create_node
                            jstree.create_node(obj, {
                                // JSON Node
                            }, "last");
                            */
                            chrome.bookmarks.create(newBookmark, refreshTree);
                        };

                        const htmlTxt = `Title:<br/><input type="text" id="newTitleInput" name="newTitle" /><br/>Url:<br/><input type="text" id="newUrlInput" name="newUrl" />`;
                        showPrompt({ html: htmlTxt, }).then(create);
                    }
                }
                , rename: {
                    separator_before: false
                    , separator_after: false

                    , icon: false
                    , label: "Rename"
                    , action: function (data) {
                        const inst = $.jstree.reference(data.reference);
                        const obj = inst.get_node(data.reference);
                        const nodeData = obj.data;

                        const rename = function(params) {
                            if(typeof params !== "object" || params.button !== BUTTON_OK) {
                                return;
                            }
                            const inputs = params.inputs;
                            if(inputs.newTitle === null) {
                                inputs.newTitle = "";
                            }
                            if (inputs.newTitle !== "") {
                                inst.rename_node(obj, inputs.newTitle);
                                nodeData.chromeNode.title = inputs.newTitle;
                                return;
                            }
                            //Allow empty name only for Bookmarks folders.
                            if (nodeData.chromeNode.url !== "") {
                                inst.rename_node(obj, nodeData.chromeNode.url);
                                nodeData.chromeNode.title = inputs.newTitle;
                                return;
                            }
                            //Can't rename node.
                            //TODO Warn the user.
                        };
                        const htmlTxt = `Title:<br /><input type="text" id="newTitleInput" name="newTitle" value="${nodeData.chromeNode.title}" style="width:100%" />`;
                        showPrompt({ html: htmlTxt, }).then(rename);
                    }
                }
                , remove: {
                    separator_before: false
                    , separator_after: false

                    , icon: false
                    , label: "Delete"
                    , action: function (data) {
                        const inst = $.jstree.reference(data.reference);
                        const obj = inst.get_node(data.reference);
                        const nodeData = obj.data;

                        // If childrens Prompt before deleting.
                        if (nodeData.chromeNode.children) {
                            const delFol = function(params) {
                                if(typeof params === "object" && params.button === BUTTON_OK) {
                                    inst.delete_node(obj);
                                }
                            };
                            showPrompt({ html: `Do you want to delete "${nodeData.chromeNode.title}" ?`, }).then(delFol);
                        } else {
                            inst.delete_node(obj);
                        }
                    }
                }
                , ccp: {
                    separator_before: true
                    , separator_after: false

                    , icon: false
                    , label: "Edit"
                    , action: false

                    , submenu: { 
                        cut: {
                            separator_before: false
                            , separator_after: false

                            , icon: false
                            , label: "Cut"
                            , action: function (data) { }
                        }
                        , copy: {
                            separator_before: false
                            , separator_after: false

                            , icon: false,
                            label: "Copy",
                            action: function (data) { }
                        }
                        , paste: {
                            separator_before: false
                            , separator_after: false

                            , icon: false
                            , label: "Paste"
                            , action: function (data) { }
                        }
                    }
                }
                , openLink: {
                    separator_before: false
                    , separator_after: false

                    , icon: false
                    , label: "Open Link"
                    , action: function (data) {
                        var inst = $.jstree.reference(data.reference);
                        var obj = inst.get_node(data.reference);
                        var nodeData = obj.data;

                        if(nodeData.chromeNode.url) {
                            location.href = nodeData.chromeNode.url;
                        }
                    }
                    , separator_before: true
                }
                , openLinkNewTab: {
                    separator_before: false
                    , separator_after: false
                    
                    , icon: false
                    , label: "Open Link in New Tab"
                    , action: function (data) {
                        var inst = $.jstree.reference(data.reference);
                        var obj = inst.get_node(data.reference);
                        var nodeData = obj.data;

                        if(nodeData.chromeNode.url) {
                            window.open(nodeData.chromeNode.url);
                        }
                    }
                }
            }
        }

        , plugins: [
            "core"
            , "themes"
            , "ui"

            , "conditionalselect"
            , "state"

            , "contextmenu"

            , "hotkeys"
            , "dnd"
        ]
    };

    /*--- Bookmarks toolbar ---*/
    const bookmarksToolbar = $("body div.bookmarks-toolbar");
    const toolSetup = {
        core: {
            data: function(parentTree, apply) {
                if(typeof parentTree !== "object" || parentTree.id !== "#") {
                    return;
                }
                const selfTree = this;
                chrome.bookmarks.getTree(function(bookmarksTree) {
                    apply.call(selfTree, [
                        nodeTojsTree(bookmarksTree[0].children[0])
                    ]);
                });
            }
        }

        //Restore Node Open/Closed
        , state: {
            key: "body div.bookmarks-toolbar:Tree"
        }
    };
    bookmarksToolbar.jstree($.extend(true, {}, treeSetup, toolSetup));
    bindTreeEvents(bookmarksToolbar);
    bookmarksToolbar.bind("state_ready.jstree", function () {
        let treeBackColor = bookmarksToolbar.css("background-color");
        $("body").css("background-color", treeBackColor);
    });

    /*--- Other bookmarks ---*/
    const otherBookmarks = $("body div.other-bookmarks");
    const otherSetup = {
        //Node Data
        core: {
            data: function(parentTree, apply) {
                if(typeof parentTree !== "object" || parentTree.id !== "#") {
                    return;
                }
                const treeInst = this;
                chrome.bookmarks.getTree(function(bookmarksTree) {
                    apply.call(treeInst, [
                        nodeTojsTree(bookmarksTree[0].children[1])
                    ]);
                });
            }
        }

        //Restore Node Open/Closed
        , state: {
            key: "body div.other-bookmarks:Tree"
        }
    };
    otherBookmarks.jstree($.extend(true, {}, treeSetup, otherSetup));
    bindTreeEvents(otherBookmarks);

    $("#jstree-div a").live("dblclick", function (e) {
        dbClickNode(e);
    });
}

function refreshTree () {
    if(!refreshEnabled) {
        return;
    }

    // Broken ways to refresh a tree...
    //$(".jstree").jstree("refresh");
    //$(".jstree").jstree(true).refresh(true, false);
    /*$(".jstree").each(function() {
        const tree = $(this).jstree(true);
        tree.refresh(true, false);
    });*/
    //$(".jstree").data("jstree", false).empty().jstree(json);

    // Use reload to keep tree state.
    window.location.reload();
}

function bindTreeEvents (tree) {
    tree.bind("rename_node.jstree", renameNode);
    tree.bind("delete_node.jstree", deleteNode);
    tree.bind("move_node.jstree", moveNode);

    tree.bind("dblclick.jstree", function (e) {
        e.reference = $(e.target).closest("li");
        dbClickNode(e);
    });

    tree.find("ul li").live("dblclick", function(e) {
        e.reference = this;
        dbClickNode(e);
    });
}

function nodeTojsTree(node) {
    const treeNode = {
        id: `${node.id}`
        , text: node.title
        , data: {
            chromeNode: node
        }
        , li_attr: { id: "li.node.id" + node.id }
        , a_attr: {}
    };

    //If url is NULL or missing, it is a folder.
    if (node.url) {
        if(treeNode.text == null || treeNode.text == "") {
            treeNode.text = node.url;
        }

        switch(localStorage.jsTree_FaviconService) {
        case "chrome":
            treeNode.icon = "chrome://favicon/" + node.url;
            break;
        case "google":
            treeNode.icon = "https://www.google.com/s2/favicons?domain=" + node.url;
            break;
        default:
            treeNode.icon = localStorage.jsTree_FaviconService + node.url;
            break;
        }

        //Only used to show the link to the user.
        //Not used when opening the link.
        treeNode.a_attr.href = node.url;

        return treeNode;
    } else {
        treeNode.children = [];

        const addChild = function(childs){
            for (let i in childs) {
                treeNode.children.push(nodeTojsTree(childs[i]));
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

function normalizeUrl(url) {
    if (!url.match(/^https?:\/\//)) {
        return "http://" + url;
    } else {
        return url;
    }
}

function moveNode (e, data) {
    const parentNode = data.instance.get_node(data.node.parent);
    const pos = $.inArray(data.node.id, parentNode.children)
    const dest = {
        parentId: parentNode.data.chromeNode.id
        , index: pos
    };
    refreshEnabled = false;
    chrome.bookmarks.move(data.node.data.chromeNode.id, dest
        , function() {
            refreshEnabled = true;
        }
    );
}

function renameNode (e, data) {
    const nodeData = data.node.data;
    const changes = {
        title: data.node.text
    };
    refreshEnabled = false;
    chrome.bookmarks.update(nodeData.chromeNode.id, changes
        , function() {
            refreshEnabled = true;
        }
    );
}

function deleteNode (e, data) {
    const nodeData = data.node.data;
    refreshEnabled = false;

    const enableRefresh = function() {
        refreshEnabled = true;
    };
    if (nodeData.chromeNode.children) {
        chrome.bookmarks.removeTree(nodeData.chromeNode.id, enableRefresh);
    } else {
        chrome.bookmarks.remove(nodeData.chromeNode.id, enableRefresh);
    }
}

function dbClickNode (e, data) {
    const inst = $.jstree.reference(e.reference || e.target);
    const obj = inst.get_node(e.reference || e.target);
    const nodeData = obj.data;

    if(nodeData.chromeNode.url) {
        if(e.ctrlKey) {
            window.open(nodeData.chromeNode.url);
        } else {
            location.href = nodeData.chromeNode.url;
        }
    } else {
        //Is a folder, open or close.
        if(inst.is_open(obj)) {
            inst.close_node(obj);
        } else {
            inst.open_node(obj);
        }
    }
    e.stopPropagation();
}
