
'use strict';

function isInElement($e, $box){
	//
}

function bindFadeOut($e, event, time=1000){
	$e.bind(event, function _(e){
		$e.unbind(event, _);
		$e.fadeOut(time, function(){
			moveIn($e.next());
		});
	});
}

function bindSlideOut($e, event, time=1000){
	$e.bind(event, function _(e){
		$e.unbind(event, _);
		$e.slideUp(time, function(){
			moveIn($e.next());
		});
	});
}

function bindHideOut($e, event, time=1000){
	$e.bind(event, function _(e){
		$e.unbind(event, _);
		$e.hide(time, function(){
			moveIn($e.next());
		});
	});
}

function moveIn($e){
	var intype = $e.attr('k-move-in');
	var time = $e.attr('k-move-in-time');
	time = (time === undefined) ?1000 :Number.parseFloat(time);
	if(Number.isNaN(time) || time < 0){ time = 0; }
	switch(intype){
		case 'fade':
			$e.fadeIn(time, function(){
				bindMoveOut($e);
			});
			break;
		case 'slide':
			$e.slideDown(time, function(){
				bindMoveOut($e);
			});
			break;
		default:
			$e.show(time, function(){
				bindMoveOut($e);
			});
	}
}

function bindMoveOut($e){
	if(!$e.next().length){
		console.log('part end');
		return;
	}
	var outtype = $e.attr('k-move-out');
	var time = $e.attr('k-move-out-time');
	time = (time === undefined) ?1000 :Number.parseFloat(time);
	if(Number.isNaN(time) || time < 0){ time = 0; }
	event = 'scroll';
	switch(outtype){
		case 'fade':
			bindFadeOut($e, event, time);
			break;
		case 'slide':
			bindSlideOut($e, event, time);
			break;
		default:
			bindHideOut($e, event, time);
	}
}

$(document).ready(function(){
	const $window = $(window);
	const $body = $('#body');
	var parts = $body.children('*[k-part]');
	parts.each(function(){
		var $this = $(this);
		$this.css({
			padding: '1rem',
			display: 'flex',
			flexDirection: $this.attr('k-view-column') !== undefined ?'column' :'row',
			alignItems: 'center',
			position: 'relative',
			right: -$window.width() + 'px',
		})
		if($this.attr('k-view-height')){
			var kvh = Number.parseFloat($this.attr('k-view-height'));
			if(!Number.isNaN(kvh) && kvh > 0){
				$this.css({
					minHeight: $(window).height() * kvh + 'px',
				});
			}
		}
		$window.scroll(function(){
			if(($this.offset().top - $window.height()) < $window.scrollTop() &&
			   ($this.offset().top + $this.height()) > $window.scrollTop()){
				if(!$this[0].goin){
					$this[0].goin = true;
					$this.animate({right: '0px'}, 1000, function(){
						$this[0].goin = undefined;
					});
				}
			}else{
				if($this[0].goin !== false){
					$this[0].goin = false;
					$this.stop(true).animate({right: -$window.width() + 'px'}, 1000);
				}
			}
		});
	});
	$window.scroll();
});
