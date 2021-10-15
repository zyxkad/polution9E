
'use strict';

function eval_(_, that=undefined){
	return eval(_);
}

(function(){
const $window = $(window);
const $document = $(document);

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
	var anistyle = $e.is('[k-animation-style]') ?parseStyle($e.attr('k-animation-style'), $e):null;
	var time = $e.is('[k-animation-time]') ?parseTime($e.attr('k-animation-time')):1000;
	var delay = $e.is('[k-animation-delay]') ?parseTime($e.attr('k-animation-delay')):0;
	if(!anistyle){
		anistyle = {};
		var anitype = $e.attr('k-animation-type');
		switch(anitype){
			case 'fade':
				anistyle['opacity'] = 1;
				break;
			case 'slide':
				anistyle['right'] = '0';
				break;
			default:
				anistyle['opacity'] = 1;
		}
	}
	$e.delay(delay).animate(anistyle, time, call);
}

function moveOut($e, call=undefined, quickly=false){
	var anistyle = $e.is('[k-animation-style-out]')?parseStyle($e.attr('k-animation-style-out')):null;
	var time = $e.is('[k-animation-time]')?parseTime($e.attr('k-animation-time')):1000;
	if(!anistyle){
		anistyle = {};
		var anitype = $e.attr('k-animation-type');
		switch(anitype){
			case 'fade':
				anistyle['opacity'] = 0;
				break;
			case 'slide':
				anistyle['right'] = '-' + $window.width() + 'px';
				break;
			default:
				anistyle['opacity'] = 0;
		}
	}
	$e.animate(anistyle, quickly?0:time, call);
}

$document.ready(function(){
	const $body = $('#body');
	$body.css({
		overflow: 'hidden',
		overflowY: 'scroll'
	})
	var parts = $body.children('*[k-part]');
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
	$body.find('*[k-view-animation]').each(function(){
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

	$body.find('.downscroll').each(function(){
		var $this = $(this);
		var cld = $this.children();
		for(let i = 0;i < cld.length;i++){
			let $c = $(cld[i]);
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
		}
		$this.click(function(){
			if(Number.parseInt($this.css('opacity')) !== 1){
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
				console.log(end);
				$window.scrollTop(end);
			}, i * 10);
		});
	})

	$window.resize()
	       .scrollTop(0).scroll();

	$('*[k-pre-holder]').hide();
});

})();
