function initOptionsPage()
{
    $("#jsTreeTheme-Menu").val(window.localStorage.getItem("jsTree_theme"));
    $("#jsTreeTheme-Dots")[0].checked = Boolean(window.localStorage.getItem("jsTree_themeDots"));
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
