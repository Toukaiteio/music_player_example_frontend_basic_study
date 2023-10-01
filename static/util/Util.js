//init Util
const PLAY_BTN=`<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 384 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#000000}</style><path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z"/></svg>`
const PAUSE_BTN=`<svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><style>svg{fill:#000000}</style><path d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/></svg>`
const SONG_TITLE_EL=document.getElementById("SONGTITLE");
const OP_BTN_EL=document.getElementById("OP");
const BGCOVER=document.getElementById("BGCOVER");
const CANVAS_CONTAINER_EL=document.getElementById("CC");
const TOASTER_EL=document.getElementById("TOASTER");
let IsToastUsing=false;
const Toast=(content,duration)=>{
    if(!IsToastUsing){
        TOASTER_EL.innerHTML=content;
        if(TOASTER_EL.classList.contains("notShowup"))
            TOASTER_EL.classList.remove("notShowup");
        TOASTER_EL.classList.remove("noMessage");
        TOASTER_EL.classList.add("onMessage");
        IsToastUsing=true;
        setTimeout(()=>{
            TOASTER_EL.classList.remove("onMessage");
            TOASTER_EL.classList.add("noMessage");
            IsToastUsing=false;
        },duration);
    }
}
//init Util end
// init player
const Player={
    _audio:new Audio('./static/media/Audio.mp3'),
    _playstatus:false,
    _isloaded:false
}
Player._audio.volume=0.5;
Player._audio.preload="auto";
Player._audio.onloadeddata=()=>{ Player._isloaded=true; }
Player._audio.onloadstart=()=>{ Player._isloaded=false; }
Player._audio.onpause=()=>{ 
    Player._playstatus=false;
    OP_BTN_EL.innerHTML=PLAY_BTN;
    if(OP_BTN_EL.classList.contains("Playing"))OP_BTN_EL.classList.remove("Playing");
    if(!SONG_TITLE_EL.classList.contains("StayInMiddle")) SONG_TITLE_EL.classList.add("StayInMiddle");
}
Player._audio.onplay=()=>{
    Player._playstatus=true;
    OP_BTN_EL.innerHTML=PAUSE_BTN;
    OP_BTN_EL.classList.add("Playing");
    if(SONG_TITLE_EL.classList.contains("StayInMiddle")) SONG_TITLE_EL.classList.remove("StayInMiddle");
}
const ChangePlayStatus=()=>{
    if(Player._isloaded){
        if(Player._playstatus){
            Player._audio.pause();
        }else{
            Player._audio.play();
        }
    }else{
        Toast("音频还在加载中~",3000);
    }
}
//init player end
//init Canvas
const CANVAS_EL=document.createElement("canvas");
const CANVAS_CTX=CANVAS_EL.getContext("2d");
CANVAS_EL.style.background="transparent";
CANVAS_EL.height=CANVAS_CONTAINER_EL.clientHeight;
CANVAS_EL.width=CANVAS_CONTAINER_EL.clientWidth;
const CanvasAnimation={
    _audio_context:null,
    _audio_source:null,
    _audio_analyser:null,
    _wave_points:new Uint8Array(Math.floor(CANVAS_EL.width / 2)),
    _wave_data_points:null,
    _hasInited:false,
    _init(){
        this._audio_context=new AudioContext;
        this._audio_source=this._audio_context.createMediaElementSource(Player._audio);
        this._audio_analyser=this._audio_context.createAnalyser();
        this._audio_source.connect(this._audio_analyser);
        this._audio_analyser.connect(this._audio_context.destination);
        const _SampleRate=this._audio_analyser.frequencyBinCount * 44100 / this._audio_context.sampleRate | 0;
        this._wave_data_points=new Uint8Array(_SampleRate);
        this._hasInited=true;
    }
};
const ResizeCallBack=()=>{
    CANVAS_EL.height=CANVAS_CONTAINER_EL.clientHeight;
    CANVAS_EL.width=CANVAS_CONTAINER_EL.clientWidth;
    if(Math.floor(CANVAS_EL.width / 2) != CanvasAnimation._wave_points.length)
        CanvasAnimation._wave_points=new Uint8Array(Math.floor(CANVAS_EL.width / 2));
}
const Observer = new ResizeObserver(ResizeCallBack);
CANVAS_CONTAINER_EL.appendChild(CANVAS_EL);
Observer.observe(CANVAS_CONTAINER_EL);
//init Canvas end
//init Canvas Painter
let BGBrightChangerState=true;
let LastBGBright=1;
BrightChanger=async (to)=>{
    if(BGBrightChangerState){
        if(LastBGBright!=to){
            BGBrightChangerState=false;
            const _ops=LastBGBright-to>0?-1:1;
            const BGBCID=setInterval(()=>{
                LastBGBright+=0.01 * _ops;
                BGCOVER.style.backdropFilter=`blur(3px) sepia(32%) grayscale(70%) brightness(${(LastBGBright).toFixed(3)})`;
                if(Math.abs(LastBGBright-to)<0.05){
                    // console.log(Math.abs(LastBGBright-to));
                    LastBGBright=to;
                    BGCOVER.style.backdropFilter=`blur(3px) sepia(32%) grayscale(70%) brightness(${(LastBGBright).toFixed(3)})`;
                    BGBrightChangerState=true;
                    clearTimeout(BGBCID);
                }
            },16) // 60 fps
        }
    }
}
function CanvasPainter(){
    CanvasAnimation._audio_analyser.getByteFrequencyData(CanvasAnimation._wave_points);
    const _canvas_width=CANVAS_EL.width;
    const _canvas_height=CANVAS_EL.height;
    let sum_aver=0;
    CANVAS_CTX.clearRect(0, 0, _canvas_width, _canvas_height);
    for (let __i in CanvasAnimation._wave_points) {
        const value = CanvasAnimation._wave_points[__i] / 5;
        sum_aver+=value / CanvasAnimation._wave_points.length;
        let posX=parseInt(__i)*2;
        CANVAS_CTX.beginPath();
        CANVAS_CTX.lineWidth=2;
        CANVAS_CTX.strokeStyle = '#ffffffff'
        CANVAS_CTX.moveTo(posX,_canvas_height/2 + value);
        // if(posX<0) console.log(posX,_canvas_height);
        CANVAS_CTX.lineTo(posX,(_canvas_height / 2) - value);
        CANVAS_CTX.stroke();
        CANVAS_CTX.closePath();
    }
    if(BGBrightChangerState) BrightChanger(0.8 + sum_aver/100);
    CanvasAnimation._audio_analyser.getByteTimeDomainData(CanvasAnimation._wave_data_points);
    const height = 100, width = 400;
    CANVAS_CTX.beginPath();
    for (let __i__ = 0; __i__ < width; __i__++) {
        CANVAS_CTX.lineTo(__i__ + 100, 300 - (height / 2 * (CanvasAnimation._wave_data_points[CanvasAnimation._wave_data_points.length * __i__ / width | 0] / 256 - 0.5)));
    }
    CANVAS_CTX.stroke();
    requestAnimationFrame(CanvasPainter);
}

//init Canvas Painter End
//init play btn
if(Player._playstatus) OP_BTN_EL.innerHTML=PAUSE_BTN;
else OP_BTN_EL.innerHTML=PLAY_BTN;
OP_BTN_EL.onclick=()=>{
    if(!CanvasAnimation._hasInited){ 
        CanvasAnimation._init();
        if(CanvasAnimation._hasInited) CanvasPainter();
        else setTimeout(CanvasPainter,300);
    }
    ChangePlayStatus();
};
//init play btn end
