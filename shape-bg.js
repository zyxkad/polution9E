
// Copyright 2021 written by zyxkad@gmail.com

'use strict';

(function(){

class Context{
	constructor(){
		this._rejecting = false;
		this.call = [];
	}

	get isrejecting(){
		return this._rejecting;
	}

	reject(){
		var cs = this.call;
		this.call = [];
		cs.forEach((c)=>{c();});
	}
	async rejectWhen(call, ...args){
		this._rejecting = true;
		this.reject();
		const re = await call(...args);
		this._rejecting = false;
		return re;
	}

	with(rj){
		if(this._rejecting){
			rj();
			return ()=>0;
		}
		this.call.push(rj);
		return ()=>{
			this.call = this.call.filter((x)=>x !== rj);
		};
	}
	async withCallAsync(rj, call, ...args){
		if(this._rejecting){
			rj();
			return;
		}
		this.call.push(rj);
		const re = await call(...args);
		this.call = this.call.filter((x)=>x !== rj);
		return re;
	}
}

function sleep(t, c=undefined){
	var s = null;
	var re0 = null;
	var r = c?c.with(()=>{
		r = null;
		if(s !== null){
			clearTimeout(s);
			if(re0 !== null){
				re0(false);
			}
		}
	}):null;
	return new Promise((re)=>{
		if(c){
			if(r){
				re0 = re;
				s = setTimeout(()=>{
					if(r){ r(); }
					re(true);
				}, t);
			}else{
				re(false);
			}
		}else{
			setTimeout(()=>{
				re(true);
			}, t);
		}
	});
}

const BG_CANVAS = document.createElement('canvas');
const BG_CTX = BG_CANVAS.getContext('2d');
BG_CANVAS.width = window.innerWidth;
BG_CANVAS.height = window.innerHeight;
BG_CANVAS.style.position = 'fixed';
BG_CANVAS.style.zIndex = '-999';
BG_CANVAS.style.left = '0';
BG_CANVAS.style.top = '0';
BG_CANVAS.style.width = '100%';
BG_CANVAS.style.height = '100%';
document.body.appendChild(BG_CANVAS);

var mousepos = null;

function Point(x=undefined, y=undefined, r=undefined, s=undefined){
	if(Math.random() < 0.5){
		this.x = (x !== undefined) ?x :((Math.random() < 0.5 ?-100 :BG_CANVAS.width) + Math.random() * 100);
		this.y = (y !== undefined) ?y :(Math.random() * BG_CANVAS.height);
	}else{
		this.x = (x !== undefined) ?x :(Math.random() * BG_CANVAS.width);
		this.y = (y !== undefined) ?y :((Math.random() < 0.5 ?-100 :BG_CANVAS.height) + Math.random() * 100);
	}
	this.r = (r !== undefined) ?r :(Math.random() * 360);
	this.s = (s !== undefined) ?s :((Math.random() * 30 + 10) / 1000);
	this.linetag = [];
	this.drawed = false;
}

Point.prototype.isalive = function(){
	return -100 <= this.x && this.x <= BG_CANVAS.width + 100 && -100 <= this.y && this.y <= BG_CANVAS.height + 100;
}

Point.prototype.distanceOf = function(obj){
	let dx = this.x - obj.x, dy = this.y - obj.y;
	return Math.sqrt(dx * dx + dy * dy);
}

Point.prototype.tick = function(n){
	this.x += Math.cos(this.r) * (this.s * n);
	this.y += Math.sin(this.r) * (this.s * n);
	this.drawed = false;
}

var linetmp = {};

Point.prototype.draw = function(ctx){
	if(this.drawed){ return; }
	this.drawed = true;
	ctx.fillStyle = '#000';
	ctx.beginPath();
	ctx.moveTo(this.x + 1, this.y);
	ctx.arc(this.x, this.y, 1, 0, Math.PI * 2, false);
	ctx.fill();
	ctx.closePath();
	for(let i of ITEM_LIST){
		if(this.linetag.indexOf(i) !== -1){ continue; }
		let dis = this.distanceOf(i);
		if(dis < 150){
			i.linetag.push(this);
			let k = this.x + ',' + this.y;
			if(!(k in linetmp)){ linetmp[k] = [[i.x, i.y, dis < 100 ?0.8 :(2.4 - dis / 62.5)]]; }
			else{ linetmp[k].push([i.x, i.y, dis < 100 ?0.8 :(2.4 - dis / 62.5)]); }
		}
	}
	this.linetag = [];
	if(mousepos){
		let dis = this.distanceOf(mousepos);
		if(dis < 150){
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(mousepos.x, mousepos.y);
			ctx.lineWidth = dis < 100 ?0.8 :((150 - dis) / (62.5));
			ctx.strokeStyle = '#000c';
			ctx.stroke();
			ctx.closePath();
		}
	}
}

var POINT_RATE = 20000;
var MAX_POINT = Math.ceil(BG_CANVAS.width * BG_CANVAS.height / POINT_RATE);
var ITEM_LIST = [];

async function tickAll(n){
	var tmp = [];
	let l = ITEM_LIST.length;
	for(let i of ITEM_LIST){
		await i.tick(n);
		if(i.isalive()){
			tmp.push(i);
		}else{
			if(--l < MAX_POINT){
				tmp.push(new Point());
			}
		}
	}
	ITEM_LIST = tmp;
}

async function drawAll(ctx){
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	linetmp = [];
	for(let i of ITEM_LIST){
		await i.draw(ctx);
	}
	ctx.strokeStyle = '#000c';
	for(let x_y in linetmp){
		let poss = linetmp[x_y];
		let [x, y] = x_y.split(',', 2).map((n)=>Number.parseInt(n));
		for(let p of poss){
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(p[0], p[1]);
			ctx.lineWidth = p[2];
			ctx.stroke();
			ctx.closePath();
		}
	}
}

const tick_context = new Context();

function ready(){
	for(let i = 0;i < MAX_POINT;i++){
		ITEM_LIST.push(new Point(Math.random() * BG_CANVAS.width, Math.random() * BG_CANVAS.height));
	}
	var lastTick = document.timeline.currentTime;
	(async function(){
		while(true){
			let t = document.timeline.currentTime;
			[t, lastTick] = [t - lastTick, t];
			await tickAll(t);
			await drawAll(BG_CTX);
			await sleep(60, tick_context);
		}
	})();
}

window.addEventListener('resize', function(){
	BG_CANVAS.width = window.innerWidth;
	BG_CANVAS.height = window.innerHeight;
	MAX_POINT = Math.ceil(BG_CANVAS.width * BG_CANVAS.height / POINT_RATE);
	while(ITEM_LIST.length < MAX_POINT){
		ITEM_LIST.push(new Point());
	}
});

window.addEventListener('mousemove', function(event){
	mousepos = {x: event.x, y: event.y};
	tick_context.reject();
});

document.addEventListener('mouseleave', function(event){
	mousepos = null;
})

if(document.readyState === 'complete'){
	ready();
}else{
	document.addEventListener('readystatechange', function(){
		if(document.readyState !== 'complete'){ return; }
		ready();
	});
}

})();
