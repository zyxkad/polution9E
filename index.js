
'use strict';

function eval_(_, that=undefined){
	return eval(_);
}

(function(){
const $window = $(window);
const $document = $(document);
const $body = $(document.body);

class Context{
	constructor(){
		this.call = [];
	}
	reject(){
		var cs = this.call;
		this.call = [];
		cs.forEach((c)=>{c(false);});
	}
	with(r){
		this.call.push(r);
	}
}

function sleep(t, c=undefined){
	return new Promise((r)=>{
		if(c){
			c.with(r);
		}
		setTimeout(()=>{r(true)}, t);
	});
}

function parseStyle(s, $this){
	var style = {};
	var that = {
		$document: $document,
		$window: $window,
		$this: $this,
		style: style
	};
	s.split(';').forEach((x)=>{
		if(s){
			let [k, v] = x.split(':', 2);
			v = v.replaceAll(/\${[^}]*}/g, (a)=>eval_(a.substring(2, a.length - 1), that));
			style[k] = v;
		}
	});
	return style;
}

function parseTime(s){
	s = Number.parseInt(s);
	if(Number.isNaN(s) || s < 0){ s = 0; }
	return s;
}

function moveIn($e, call=undefined){
	var anistyle = $e.is('[k-animation-default-style]') ?parseStyle($e.attr('k-animation-default-style'), $e):null;
	var time = $e.is('[k-animation-time]') ?parseTime($e.attr('k-animation-time')):1000;
	var delay = $e.is('[k-animation-delay]') ?parseTime($e.attr('k-animation-delay')):0;
	if(!anistyle){
		if($e[0].k_default_css){
			anistyle = $e[0].k_default_css;
		}else{
			anistyle = {};
			var anitype = $e.attr('k-animation-type');
			switch(anitype){
				case 'fade':
					anistyle['opacity'] = '1';
					break;
				case 'slide':
				case 'slide-right':
					anistyle['right'] = '0';
					break;
				case 'slide-left':
					anistyle['left'] = '0';
					break;
				case 'input':
					setTimeout(()=>{moveIn_input($e, call, time)}, delay);
					return;
				default:
					anistyle['opacity'] = '1';
			}
		}
	}
	$e.delay(delay).animate(anistyle, time, call);
}

function moveOut($e, call=undefined, quickly=false){
	var anistyle = $e.is('[k-animation-style]')?parseStyle($e.attr('k-animation-style')):null;
	var time = $e.is('[k-animation-time]')?parseTime($e.attr('k-animation-time')):1000;
	if(!anistyle){
		anistyle = {};
		var anitype = $e.attr('k-animation-type');
		switch(anitype){
			case 'fade':
				anistyle['opacity'] = '0';
				break;
			case 'slide':
			case 'slide-right':
				anistyle['right'] = '-' + $window.width() + 'px';
				break;
			case 'slide-left':
				anistyle['left'] = '-' + $window.width() + 'px';
				break;
			case 'input':
				moveOut_input($e, call, quickly?0:time);
				return;
			default:
				anistyle['opacity'] = '0';
		}
	}
	if(!$e[0].k_default_css){
		$e[0].k_default_css = {};
		for(let k in anistyle){
			$e[0].k_default_css[k] = $e.css(k);
		}
	}
	$e.animate(anistyle, quickly?0:time, call);
}

class TagNode extends window.Comment{
	constructor(tag=undefined){
		super('');
		this._k_tag = tag;
	}
	get nodeName(){
		return '#tag';
	}
	get k_tag(){
		return this._k_tag;
	}
	hasChildNodes(){
		return false;
	}
}

class HodeTextNode extends window.Text{
	constructor(text){
		text = text.replace(/(^[ \t\r\n]+|[ \t\r\n]+$)/g, '');
		super(text?'\u00A0':'');
		this._k_text = text;
	}
	get nodeName(){
		return '#textholder';
	}
	get k_text(){
		return this._k_text;
	}
}

function hideAllText(ele){
	if(!ele.hasChildNodes()){ return; }
	var nodes = ele.childNodes;
	for(let i = 0;i < nodes.length;i++){
		if(nodes[i].nodeName.toLowerCase() === '#text'){
			if(nodes[i].nextSibling && nodes[i].nextSibling.nodeName.toLowerCase() === '#tag'){
				let text = nodes[i].nextSibling.k_tag;
				ele.removeChild(nodes[i].nextSibling);
				ele.replaceChild(new HodeTextNode(text), nodes[i]);
			}else{
				ele.replaceChild(new HodeTextNode(nodes[i].nodeValue), nodes[i]);
			}
		}else{
			hideAllText(nodes[i]);
		}
	}
}

function getTextLen(ele){
	var len = 0;
	switch(ele.nodeName.toLowerCase()){
		case "#text": len = ele.nodeValue.length; break;
		case "#textholder": len = ele.k_text.length; break;
		default:
			if(ele.hasChildNodes()){
				for(let n of ele.childNodes){
					len += getTextLen(n);
				}
			}
	}
	return len;
}

function moveIn_input($e, call=undefined, time=1000){
	const textlen = getTextLen($e[0]);
	if(!textlen){
		return;
	}
	const pert = time / textlen;
	var showText = async function(e){
		const parent = e.parentNode;
		if(e.nodeName.toLowerCase() === "#textholder"){
			let text = e.k_text;
			let tag = new TagNode(text);
			parent.insertBefore(tag, e.nextSibling);
			for(let i = 1;i <= text.length;i++){
				parent.replaceChild(e = new window.Text(text.substring(0, i)), tag.previousSibling);
				if(!await sleep(pert, $e[0].k_ani_ctx)){
					return false;
				}
			}
			parent.removeChild(tag);
		}else{
			if(e.hasChildNodes()){
				if(!await showText(e.firstChild)){
					return false;
				}
			}
		}
		if(e.nextSibling !== null){
			if(!await showText(e.nextSibling)){
				return false;
			}
		}
		return true;
	}
	showText($e[0].firstChild);
}

function moveOut_input($e, call=undefined, time=1000){
	if(time < 0){
		time = 0;
	}
	if(!$e[0].k_ani_ctx){
		$e[0].k_ani_ctx = new Context();
	}
	$e[0].k_ani_ctx.reject();
	hideAllText($e[0]);
}

$document.ready(function(){
	const $view = $('#body');
	$view.css({
		overflow: 'hidden'
	});
	$body.css({
		overflow: 'hidden',
		overflowY: 'scroll'
	})
	var parts = $view.children('*[k-part]');
	parts.each(function(){
		var $this = $(this);
		$this.css({
			paddingLeft: '1rem',
			paddingRight: '1rem',
			display: 'flex',
			flexDirection: $this.attr('k-view-column') !== undefined ?'column' :'row',
			alignItems: 'center',
			position: 'relative',
		})
		if($this.attr('k-view-height')){
			var kvh = Number.parseFloat($this.attr('k-view-height'));
			if(!Number.isNaN(kvh) && kvh > 0){
				if(kvh > 1){ kvh = 1; }
				$window.resize(function(){
					$this.css({
						minHeight: $window.height() * kvh + 'px',
					});
				})
			}
		}
	});
	$view.find('*[k-view-animation]').each(function(){
		var $this = $(this);
		if($this.css('position') === 'static'){
			$this.css({
				position: 'relative'
			});
		}
		$window.scroll(function(){
			if($this.offset().top + $this.height() * 1 / 3 < $window.scrollTop() + $window.height() &&
			   $this.offset().top + $this.height() * 2 / 3 > $window.scrollTop()){
				if(!$this[0].k_animationed){
					$this[0].k_animationed = 1;
					moveIn($this, function(){
						$this[0].k_animationed = null;
					});
				}
			}else{
				if($this[0].k_animationed !== 0){
					$this[0].k_animationed = 0;
					moveOut($this.stop(true));
				}
			}
		});
		moveOut($this, undefined, true);
	});

	$view.find('*[k-load-animation]').each(function(){
		var $this = $(this);
		if($this.css('position') === 'static'){
			$this.css({
				position: 'relative'
			});
		}
		moveOut($this, undefined, true);
		$this[0].k_animationed = 1;
		moveIn($this, function(){
			$this[0].k_animationed = null;
		});
	})

	$view.find('.downscroll').each(function(){
		var $this = $(this);
		$this.children().each(function(i){
			let $c = $(this);
			let up = function(){
				$c.animate({
					top: (i + 1) * 3 + 'rem'
				}, 1000, down);
			}
			let down = function(){
				$c.animate({
					top: (i + 1) + 'rem'
				}, 1000, up);
			};
			up();
		})
		$this.click(function(){
			if(Number.parseInt($this.css('opacity')) !== 1 || $body.css('overflowY') == 'hidden'){
				return;
			}
			var end = $this.offset().top + $this.height();
			let n = $window.scrollTop(), i = 0;
			let frame = (end - n) / 30;
			for(;n < end;n += frame){
				let m = n;
				setTimeout(()=>{
					$window.scrollTop(m);
				}, (i++) * 10);
			}
			setTimeout(()=>{
				$window.scrollTop(end);
			}, i * 10);
		});
	})

	{
		let $signshower = $(`<div></div>`).css({width:'0',height:'0',
			position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
			backgroundColor:'#fffe',fontSize:'3rem',textAlign:'center'}).hide();
		$(document.body).append($signshower);
		let ei = 0;
		$view.find('.signature').each(function(i){
			var $this = $(this);
			setTimeout(()=>{
				$signshower.html('').
					append($('<h3></h3>').css({fontFamily:'"Brush Script MT",cursive'}).text($this.text())).
					css({width:'100%',height:'100%'}).fadeIn(1500, function(){
					$signshower.delay(1000).animate({
						width: '50%',
						height: '0%'
					}, 800, function(){
						$signshower.hide();
					});
				});
			}, i * 5000 + 2000);
			ei = i + 1;
		});
		if(ei > 0){
			$body.css({
				overflowY: 'hidden'
			});
			setTimeout(()=>{
				$body.css({
					overflowY: 'scroll'
				});
			}, ei * 5000 + 2000);
		}
	}

	$window.resize()
	       .scrollTop(0).scroll();

	$('*[k-pre-holder]').hide();
});

})();
