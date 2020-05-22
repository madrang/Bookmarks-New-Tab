
function parseBool(str)
{
	return str==true || str=="true";
}

function initOptionsPage()
{
	$("#jsTreeTheme-Menu").val(localStorage.jsTree_theme);
	$("#jsTreeTheme-Dots")[0].checked = parseBool(localStorage.jsTree_themeDots);
	$("#hideApps")[0].checked = parseBool(localStorage.hideApps);

	$("#jsTreeTheme-Menu").change(function(ev) {
		localStorage.jsTree_theme = $(ev.target).val();
	});
	$("#jsTreeTheme-Dots").change(ev => {
		localStorage.jsTree_themeDots = $(ev.target)[0].checked;
	});
	$("#hideApps").change(ev => {
		localStorage.hideApps = $(ev.target)[0].checked;
	});
}

$(document).ready(initOptionsPage);

