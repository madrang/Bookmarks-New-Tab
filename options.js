
function parseBool(str)
{
	return str==true || str=="true";
}

function initOptionsPage()
{
	$("#jsTreeTheme-Menu").val(localStorage.jsTree_theme);
	$("#jsTreeTheme-Dots")[0].checked = parseBool(localStorage.jsTree_themeDots);

	$("#jsTreeTheme-Menu").change(function(ev) {
		localStorage.jsTree_theme = $(ev.target).val();
	});
	$("#jsTreeTheme-Dots").change(ev => {
		localStorage.jsTree_themeDots = $(ev.target)[0].checked;
	});
}

$(document).ready(initOptionsPage);

