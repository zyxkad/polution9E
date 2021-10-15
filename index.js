
'use strict';

function parseTime(s){
	s = Number.parseInt(s);
	if(Number.isNaN(s) || s < 0){ s = 0; }
	return s;
}

function moveIn($e, call=undefined){
	var anistyle = $e.is('[k-animation-style]')?JSON.parse('{' + $e.attr('k-animation-style') + '}'):null;
	var time = $e.is('[k-animation-time]')?parseTime($e.attr('k-animation-time')):1000;
	var delay = $e.is('[k-animation-delay]')?parseTime($e.attr('k-animation-delay')):0;
	if(!anistyle){
		anistyle = {};
		var anitype = $e.attr('k-anmation-type');
		switch(anitype){
			case 'fade':
				anistyle['opacity'] = 1;
				break;
			case 'slide':
				anistyle['right'] = '0%';
				break;
			default:
				anistyle['opacity'] = 1;
		}
	}
	console.log($e[0], anistyle, time);
	$e.delay(delay).animate(anistyle, time, call);
}

function moveOut($e, call=undefined, quickly=false){
	var anistyle = $e.is('[k-animation-style-out]')?JSON.parse('{' + $e.attr('k-animation-style-out') + '}'):null;
	var time = $e.is('[k-animation-time]')?parseTime($e.attr('k-animation-time')):1000;
	if(!anistyle){
		anistyle = {};
		var anitype = $e.attr('k-anmation-type');
		switch(anitype){
			case 'fade':
				anistyle['opacity'] = 0;
				break;
			case 'slide':
				anistyle['right'] = '-100%';
				break;
			default:
				anistyle['opacity'] = 0;
		}
	}
	$e.animate(anistyle, quickly?0:time, call);
}

$(document).ready(function(){
	const $window = $(window);
	const $body = $('#body');
	$body.css({
		overflow: 'hidden',
		overflowY: 'scroll'
	})
	var parts = $body.children('*[k-part]');
	parts.each(function(){
		var $this = $(this);
		$this.css({
			padding: '1rem',
			display: 'flex',
			flexDirection: $this.attr('k-view-column') !== undefined ?'column' :'row',
			alignItems: 'center',
		})
		if($this.attr('k-view-height')){
			var kvh = Number.parseFloat($this.attr('k-view-height'));
			if(!Number.isNaN(kvh) && kvh > 0){
				$this.css({
					minHeight: $(window).height() * kvh + 'px',
				});
			}
		}
	});
	$body.find('*[k-view-animation]').each(function(){
		var $this = $(this);
		$this.css({
			position: 'relative'
		});
		$window.scroll(function(){
			if($this.offset().top < $window.scrollTop() + $window.height() * 2 / 3 &&
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
	$window.scroll();
});