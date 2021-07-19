"use strict";

function initOptionsPage() {
    $("#jsTreeTheme-Menu").val(window.localStorage.getItem("jsTree_theme"));
    $("#jsTreeTheme-Dots")[0].checked = Boolean(window.localStorage.getItem("jsTree_themeDots"));
    $("#jsTreeTheme-Stripes")[0].checked = Boolean(window.localStorage.getItem("jsTree_themeStripes"));
    $("#hideApps")[0].checked = Boolean(window.localStorage.getItem("hideApps"));

    $("#jsTreeTheme-Menu").change(function(ev) {
        let jsTree_theme = $(ev.target).val();
        if (!jsTree_theme || jsTree_theme.trim() === "") {
            window.localStorage.removeItem("jsTree_theme");
            return;
        }
        window.localStorage.setItem("jsTree_theme", jsTree_theme);
    });
    $("#jsTreeTheme-Dots").change(ev => {
        const showDots = $(ev.target)[0];
        if (showDots.checked) {
            window.localStorage.setItem("jsTree_themeDots", 1);
        } else {
            window.localStorage.removeItem("jsTree_themeDots");
        }
    });
    $("#jsTreeTheme-Stripes").change(ev => {
        const stripesInput = $(ev.target)[0];
        if (stripesInput.checked) {
            window.localStorage.setItem("jsTree_themeStripes", 1);
        } else {
            window.localStorage.removeItem("jsTree_themeStripes");
        }
    });
    $("#hideApps").change(ev => {
        const hideApps = $(ev.target)[0];
        if (hideApps.checked) {
            window.localStorage.setItem("hideApps", 1);
        } else {
            window.localStorage.removeItem("hideApps");
        }
    });
}

$(document).ready(initOptionsPage);
