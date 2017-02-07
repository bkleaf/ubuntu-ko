/*
Manga - Air Comix Web Client
Copyright (C) 2013 
    Lee Dong Woo <choco529@naver.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

var origLoaderTemplate=null;
var globalLoginUsername='';
var globalLoginPassword='';
var isUserLogged = false;
var isReverseDir = false;
var globalUrlTrace = '';

var _LASTURL = "lasturl";
var _LASTFILE = "lastfile";
var _LASTDIR = "reversdir";

// file list management object
function ItemList()
{
	var item_num = [];
	var item_extension = [];
	var item_str = [];
	var total = 0;

	this.length = function() {
		return total;
	}

	this.push = function(item) {
    	var token = item.split(".");

    	if ( token.length == 2 &&
        	 !isNaN(token[0]))
    	{
        	item_num.push(token[0]);
        	item_extension.push(token[1]);
    	}
		else
			item_str.push(item);

		total = total+1;	
	}

	this.get = function(index) {
		if (index > item_num.length + item_str.length)
			return "";

		if (index < item_num.length)
			return (item_num[index] + "." + item_extension[index]);

		var i = index - item_num.length;

		return item_str[i];
			
	}

	this.sort = function() {
		for (var i=0; i < item_num.length; i++)
			for (var j=0; j < item_num.length-1; j++)
			{
				if (parseInt(item_num[j]) > parseInt(item_num[j+1]))
				{ // bubble sort
					var tmp = item_num[j];	
					var tmp2 = item_extension[j];

					item_num[j] = item_num[j+1];
					item_extension[j] = item_extension[j+1];	

					item_num[j+1] = tmp;
					item_extension[j+1] = tmp2;
				}
			}

		item_str.sort();	
	}

	this.clear = function() {
		while (item_num.length > 0)
			item_num.pop();

		while (item_extension.length > 0)
			item_extension.pop();

		while (item_str.length > 0)
			item_str.pop();		

		total = 0;
	}
}

// image file url management object
function ImageContainer()
{
	var images=[];
	var currentIndex=0;
	var total=0;
	var zoom=100;

	this.insertImage = function(_name, _path) {
		images.push({name:_name, path:_path});
		total = total+1;
	}

	this.setCurrent = function(_name) {
		for (var i=0; i<images.length; i++)
		{
			if (images[i].name == _name)
			{
				currentIndex = i;
				break;
			}
		}

		return currentIndex;
	}

	this.prevImagePath = function() {
		if (currentIndex > 0)
			currentIndex = currentIndex-1;

		return images[currentIndex].path;	
	}

	this.nextImagePath = function() {
		if (total < 1)
			return;

		if (currentIndex < total-1 && currentIndex < total)
			currentIndex = currentIndex+1;

		return images[currentIndex].path;
	}

	this.getName = function() {
		return images[currentIndex].name;
	}

	this.getZoomIn = function() {
		zoom = zoom + 10;

		return this.getZoom();
	}

	this.getZoomOut = function() {
		if (zoom > 0)
			zoom = zoom - 10;

		return this.getZoom();
	}

	this.getZoom = function() {
		var szZoom = zoom + "\%";

		return szZoom;
	}

	this.setClear = function() {
		while (images.length > 0) {
			images.pop();
		}

		currentIndex = 0;
		total = 0;
	}

	this.length = function() {
		return total;
	}

	this.getNameByIdx = function(index) {
        if (index < 0 && index > total)
           return "";

		return images[index].name;
	}
}

var gImageHandle = new ImageContainer();
var globalItemList = new ItemList();

window.onload=globalMain;

function loadConfig()
{
	if(globalLoginUsername=='' || globalLoginPassword=='')
	{
		$('#LoginPage').fadeTo(500, 1, function(){$('[data-type="system_username"]').focus()});
		$('#LoginLoader').fadeOut(1200);
	
		return false;
	}
	
	// cookies가 있다면 해당 url로 요청
   
	var lasturl = getCookie(_LASTURL);
	
	if (lasturl == "")
		sendRequest(globalNetworkCheckSettings.href);
	else
		sendRequest(lasturl);

	var dir = getCookie(_LASTDIR);

	if (dir == 'true')
	{
		isReverseDir = true;
		$("#Direct").attr('src', 'images\/reversedir.png');
	}
	else
	{
		 isReverseDir = false;
		 $("#Direct").attr('src', 'images\/normdir.png');
	}

	return true;
}

function login(){
	$("#LoginLoader").fadeTo(1200, 1, function(){
		globalLoginUsername=$('#LoginPage').find('[data-type="system_username"]').val();
		globalLoginPassword=$('#LoginPage').find('[data-type="system_password"]').val();

		loadConfig();
	 });

}

function processXml(xml)
{
	var lastfile = getCookie(_LASTFILE);

	// clear global list
	clearGlobalItemList();

	// insert list
	$(xml).find('ITEM').each(insertList);

	// list sort
	globalItemList.sort();

	// display list
	$("li").remove();

	$("#TitleList").append("<li>..</li>")

	for (var i=0; i<globalItemList.length(); i++)
	{
		var item = globalItemList.get(i);

		if (isGraphicFile(item))
		{
			var url = globalUrlTrace + item
			gImageHandle.insertImage(item, url);
		}

		var li = "";

		if (lastfile != "" && lastfile == item)
		{
			li = "<li><strong>" + item + "</strong></li>";

			$(window).scrollTop(600*i/19+i%19+30);
		}
		else
			li = "<li>" + item + "</li>";

		$("#TitleList").append(li)
	}

	$("li").hover(
		function() {
			$(this).css({"color":"blue", "font-weight":"bold", "text-decoration":"underline", "cursor":"pointer"});
		},
		function() {
			$(this).css({"color":"black", "font-weight":"normal", "text-decoration":"none", "cursor":"auto"});
		}
	);

	$("li").click(selectItem)

}

function refreshList()
{
	var lastfile = getCookie(_LASTFILE);

    // display list
    $("li").remove();

    $("#TitleList").append("<li>..</li>")

    for (var i=0; i<gImageHandle.length(); i++)
    {
        var item = gImageHandle.getNameByIdx(i);

        var li = "";

        if (lastfile != "" && lastfile == item)
        {
            li = "<li><strong>" + item + "</strong></li>";
        }
        else
            li = "<li>" + item + "</li>";

        $("#TitleList").append(li)
    }

    $("li").hover(
        function() {
            $(this).css({"color":"blue", "font-weight":"bold", "text-decoration":"underline", "cursor":"pointer"});
        },
        function() {
            $(this).css({"color":"black", "font-weight":"normal", "text-decoration":"none", "cursor":"auto"});
        }
    );

    $("li").click(selectItem)
}

function clearGlobalItemList()
{
	globalItemList.clear();
}

function insertList()
{
	var item = $(this).text();

	if (item == "")
		return;

	globalItemList.push(item);
}

function selectItem()
{
	var item = $(this).text();

	if (item == "..")
	{
		var token = globalUrlTrace.split("/");

		var tokenNum = token.length;

		if (tokenNum > 4)
		{
			var rename = convertSpecialChar(token[tokenNum-2]);
			var start = globalUrlTrace.search(rename);
			var backurl = globalUrlTrace.substr(0, start);

			gImageHandle.setClear();

			sendRequest(backurl);
		}
	}
	else if (isGraphicFile(item))
	{
        // 이미지 화면 표시 모드로....
		$("#ListPage").fadeOut(1);	

        // 이미지 파일 표시......
		$("#Picture").attr({'src':globalUrlTrace + item, 'alt':item});

		$("#Picture").load(function() {
			$("#PicturePage").css('visibility', 'visible');
			$(window).scrollTop(0); 
			if (isReverseDir == true)
				$("#container").scrollLeft(300);
			else
				$("#container").scrollLeft(0);
			gImageHandle.setCurrent(item);
			$("#ImageTitle").text(item);
			$("#Picture").unbind('load');

			saveCookie(_LASTFILE, item);
		});
	}
	else
	{
		$("#ListPage").fadeOut(1);
		$("#MainLoader").fadeTo(1, 1, function(){
			var url = globalUrlTrace + item;

			sendRequest(url);

			saveCookie(_LASTURL, url);
		});
	}
}

function onExit()
{
	$("#ListPage").fadeTo(700, 1, function() {
		$("#PicturePage").css('visibility', 'hidden');
		$("#Picture").attr('src', "");
	});

	var name = gImageHandle.getName();

	if (name == getCookie(_LASTFILE))
	{
		refreshList();
	}
}

function onPrev()
{
	var url = (isReverseDir == true)?gImageHandle.nextImagePath():gImageHandle.prevImagePath();
	var name = gImageHandle.getName();
	var szZoom = gImageHandle.getZoom();

	loadImage(url, szZoom, name);

	saveCookie(_LASTFILE, name);
}

function onNext()
{
	var url = (isReverseDir == true)?gImageHandle.prevImagePath():gImageHandle.nextImagePath();
	var name = gImageHandle.getName();
	var szZoom = gImageHandle.getZoom(); 

	loadImage(url, szZoom, name);

	saveCookie(_LASTFILE, name);
}

function loadImage(url, szZoom, name)
{

	$("#PicturePage").css('cursor', 'wait');
	$("#Loading").show();

    $("#Picture").attr({'src':url, 
						'width':szZoom, 'height':'auto',
					    'alt':name});

	$("#Picture").load(function() {
		$(window).scrollTop(0); 
		if (isReverseDir == true)
		{
			window.scrollTo(500,0);  // 안드로이드폰에서 작동하도록
			$("#container").scrollLeft(500);
		}
		else
		{
			window.scrollTo(0,0);
			$("#container").scrollLeft(0);
		}
		$("#PicturePage").css('cursor', 'default');
		$("#Loading").hide();
		$("#ImageTitle").text(name);
	});
}

function isMobile()
{
	var filter = "win16|win32|win64|mac|macintel";

	if( navigator.platform  ) {
		if( filter.indexOf(navigator.platform.toLowerCase())<0 ) {
			return true;
		}
	}

	return false;
}

function onZoomOut()
{
	var szZoom = gImageHandle.getZoomOut();

	$("#Picture").css({'width':szZoom, 'height':'auto'});
}

function onZoomIn()
{
	var szZoom = gImageHandle.getZoomIn();

	$("#Picture").css({'width':szZoom, 'height':'auto'});
}

function isGraphicFile(item)
{
	var tmp = item.toLowerCase(); 
	
	if (tmp.match(/\.jpg$/) ||
        tmp.match(/\.gif$/) ||
        tmp.match(/\.png$/) ||
        tmp.match(/\.tif$/) ||
        tmp.match(/\.bmp$/) ||
        tmp.match(/\.jpeg$/) ||
        tmp.match(/\.tiff$/))
		return true;

	return false;
}

function onDirect()
{
	isReverseDir = !isReverseDir;

	if (isReverseDir == true)
	{
		$("#Direct").attr('src', 'images\/reversedir.png');
		saveCookie(_LASTDIR, 'true');	
	}
	else
	{
		$("#Direct").attr('src', 'images\/normdir.png');
		saveCookie(_LASTDIR, 'false');
	}

}

function convertSpecialChar(str)
{
	var retStr = '';

	for (var i=0; i<str.length; i++)
	{
		if (str[i] >= '\!' && str[i] <= '\/' ||
			str[i] >= '\:' && str[i] <= '\@' ||
			str[i] >= '\[' && str[i] <= '\`' ||
			str[i] >= '\{' && str[i] <= '\~')
			retStr = retStr + '\\' + str[i];
		else
			retStr = retStr + str[i];
	}

	return retStr;
}

function sendRequest(url)
{
	var reurl = "";

	if (url.match(/\/$/))
		reurl = url;
	else
		reurl = url + "/";

	console.log("REQUEST URL:" + reurl);

	$.ajax({
		url: 'php/greet.php',
		type: 'POST',
		cache: false,
		data: {'action':'GET', 'url':reurl,
				'username':globalLoginUsername, 'password':globalLoginPassword},
		
		success: function(xml, status) {
			if (status != 'success')
				return false;

			if (isUserLogged != true)
			{
				$('#LoginPage').fadeOut(1);
				$('#LoginLoader').fadeOut(1200);

				isUserLogged = true;
			}
			else
			{
				$('#MainLoader').fadeOut(1);
				$('#ListPage').fadeTo(1, 1, 	function(){$('#TitleList').focus();});
			}

			globalUrlTrace = reurl;

			processXml(xml);
		},
		
		error: function(xhr, desc, err) {
			console.log(xhr);
			console.log("Detail: " + desc + "\nError: " + err);
		}
	});

    return false;
}

function saveCookie(name, data)
{
	// cookies를 이용하여 마지막에 access 했던 url 저장
	var today = new Date();
	today.setDate(today.getDate() + 180);
	document.cookie = name + "=" + data + "; path=/; expires=" + today.toGMTString() + ";";
}

function getCookie(name)
{
	var cname = name + "=";
	var cookie = document.cookie;
	var start = cookie.indexOf(cname);
	var cvalue = "";


	if (start != -1)
	{
		start += cname.length;

		var end = cookie.indexOf(";", start);
		if (end == -1) 
			end = cookie.length;

		cvalue = cookie.substring(start, end);
	}

	return cvalue;
}

function globalMain()
{
	origLoaderTemplate = $('#MainLoaderInner').clone().wrap('<div>').html();

	$('#MainLoaderInner').html(origLoaderTemplate);

	$('#LoginPage').fadeTo(500, 1, function(){$('[data-type="system_username"]').focus()});

	$("#container").dragscrollable('acceptPropagatedEvent', 'false');

	$("#Exit").click(onExit);
	$("#ZoomIn").click(onZoomIn);
	$("#ZoomOut").click(onZoomOut);
	$("#Prev").click(onPrev);
	$("#Next").click(onNext);
	$("#Direct").click(onDirect);

	$("#Loading").hide();
}
