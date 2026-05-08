/* Hyperspeed effect — vanilla JS port of the React Bits component */
(function(){
  function start(THREE, PP){
    if(window.__hyperspeedStarted) return;
    window.__hyperspeedStarted = true;
    var BloomEffect=PP.BloomEffect, EffectComposer=PP.EffectComposer, EffectPass=PP.EffectPass,
        RenderPass=PP.RenderPass, SMAAEffect=PP.SMAAEffect, SMAAPreset=PP.SMAAPreset;

    var BASE_OPTIONS = {
      onSpeedUp:function(){}, onSlowDown:function(){},
      distortion:'turbulentDistortion',
      length:400, roadWidth:10, islandWidth:2, lanesPerRoad:3,
      fov:90, fovSpeedUp:140, speedUp:2,
      carLightsFade:0.4, totalSideLightSticks:14, lightPairsPerRoadWay:28,
      shoulderLinesWidthPercentage:0.05, brokenLinesWidthPercentage:0.1, brokenLinesLengthPercentage:0.5,
      lightStickWidth:[0.12,0.5], lightStickHeight:[1.3,1.7],
      movingAwaySpeed:[60,80], movingCloserSpeed:[-120,-160],
      carLightsLength:[400*0.03,400*0.2], carLightsRadius:[0.05,0.14],
      carWidthPercentage:[0.3,0.5], carShiftX:[-0.8,0.8], carFloorSeparation:[0,5]
    };
    var DARK_COLORS = {
      roadColor:0x080808, islandColor:0x0a0a0a, background:0x0A0A0A,
      shoulderLines:0xffffff, brokenLines:0xffffff,
      leftCars:[0x4f9bff, 0x6aa9ff, 0x86c1ff],
      rightCars:[0x12c2e9, 0x4ad1e0, 0x8ee8ec],
      sticks:0x12c2e9
    };
    var LIGHT_COLORS = {
      roadColor:0xe6ecf2, islandColor:0xd6dde6, background:0xFAFAFA,
      shoulderLines:0x2a3340, brokenLines:0x2a3340,
      leftCars:[0x0a5a9e, 0x0e6db8, 0x2079c7],
      rightCars:[0x12c2e9, 0x4ad1e0, 0x66a6d9],
      sticks:0x0a5a9e
    };
    function getColors(){
      var theme = document.documentElement.getAttribute('data-theme') || 'dark';
      return theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
    }

    var turbulentUniforms = { uFreq:{value:new THREE.Vector4(4,8,8,1)}, uAmp:{value:new THREE.Vector4(25,5,10,10)} };
    function nsin(v){return Math.sin(v)*0.5+0.5}

    var distortions = {
      turbulentDistortion: {
        uniforms: turbulentUniforms,
        getDistortion: `
          uniform vec4 uFreq;
          uniform vec4 uAmp;
          float nsin(float val){ return sin(val)*0.5+0.5; }
          #define PI 3.14159265358979
          float getDistortionX(float progress){
            return (cos(PI*progress*uFreq.r+uTime)*uAmp.r + pow(cos(PI*progress*uFreq.g+uTime*(uFreq.g/uFreq.r)),2.)*uAmp.g);
          }
          float getDistortionY(float progress){
            return (-nsin(PI*progress*uFreq.b+uTime)*uAmp.b + -pow(nsin(PI*progress*uFreq.a+uTime/(uFreq.b/uFreq.a)),5.)*uAmp.a);
          }
          vec3 getDistortion(float progress){
            return vec3(getDistortionX(progress)-getDistortionX(0.0125), getDistortionY(progress)-getDistortionY(0.0125), 0.);
          }
        `,
        getJS: function(progress, time){
          var uFreq = turbulentUniforms.uFreq.value, uAmp = turbulentUniforms.uAmp.value;
          var getX = function(p){ return Math.cos(Math.PI*p*uFreq.x+time)*uAmp.x + Math.pow(Math.cos(Math.PI*p*uFreq.y+time*(uFreq.y/uFreq.x)),2)*uAmp.y; };
          var getY = function(p){ return -nsin(Math.PI*p*uFreq.z+time)*uAmp.z - Math.pow(nsin(Math.PI*p*uFreq.w+time/(uFreq.z/uFreq.w)),5)*uAmp.w; };
          var distortion = new THREE.Vector3(getX(progress)-getX(progress+0.007), getY(progress)-getY(progress+0.007), 0);
          var lookAtAmp = new THREE.Vector3(-2,-5,0); var lookAtOffset = new THREE.Vector3(0,0,-10);
          return distortion.multiply(lookAtAmp).add(lookAtOffset);
        }
      }
    };

    function random(base){ if(Array.isArray(base)) return Math.random()*(base[1]-base[0])+base[0]; return Math.random()*base; }
    function pickRandom(arr){ if(Array.isArray(arr)) return arr[Math.floor(Math.random()*arr.length)]; return arr; }
    function lerp(current,target,speed,limit){ speed = speed==null?0.1:speed; limit = limit==null?0.001:limit; var change=(target-current)*speed; if(Math.abs(change)<limit) change = target-current; return change; }

    var carLightsFragment = `
#define USE_FOG
${THREE.ShaderChunk['fog_pars_fragment']}
varying vec3 vColor;
varying vec2 vUv;
uniform vec2 uFade;
void main() {
  vec3 color = vec3(vColor);
  float alpha = smoothstep(uFade.x, uFade.y, vUv.x);
  gl_FragColor = vec4(color, alpha);
  if (gl_FragColor.a < 0.0001) discard;
  ${THREE.ShaderChunk['fog_fragment']}
}
`;

    var carLightsVertex = `
#define USE_FOG
${THREE.ShaderChunk['fog_pars_vertex']}
attribute vec3 aOffset;
attribute vec3 aMetrics;
attribute vec3 aColor;
uniform float uTravelLength;
uniform float uTime;
varying vec2 vUv;
varying vec3 vColor;
#include <getDistortion_vertex>
void main() {
  vec3 transformed = position.xyz;
  float radius = aMetrics.r;
  float myLength = aMetrics.g;
  float speed = aMetrics.b;
  transformed.xy *= radius;
  transformed.z *= myLength;
  transformed.z += myLength - mod(uTime * speed + aOffset.z, uTravelLength);
  transformed.xy += aOffset.xy;
  float progress = abs(transformed.z / uTravelLength);
  transformed.xyz += getDistortion(progress);
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
  vColor = aColor;
  ${THREE.ShaderChunk['fog_vertex']}
}
`;

    function CarLights(webgl, options, colors, speed, fade){ this.webgl=webgl; this.options=options; this.colors=colors; this.speed=speed; this.fade=fade; }
    CarLights.prototype.init = function(){
      var options = this.options;
      var curve = new THREE.LineCurve3(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1));
      var geometry = new THREE.TubeGeometry(curve, 24, 1, 6, false);
      var instanced = new THREE.InstancedBufferGeometry().copy(geometry);
      instanced.instanceCount = options.lightPairsPerRoadWay * 2;
      var laneWidth = options.roadWidth / options.lanesPerRoad;
      var aOffset=[], aMetrics=[], aColor=[];
      var colors = this.colors;
      colors = Array.isArray(colors)? colors.map(function(c){return new THREE.Color(c);}) : new THREE.Color(colors);
      for(var i=0;i<options.lightPairsPerRoadWay;i++){
        var radius = random(options.carLightsRadius);
        var length = random(options.carLightsLength);
        var spd = random(this.speed);
        var carLane = i % options.lanesPerRoad;
        var laneX = carLane*laneWidth - options.roadWidth/2 + laneWidth/2;
        var carWidth = random(options.carWidthPercentage)*laneWidth;
        var carShiftX = random(options.carShiftX)*laneWidth;
        laneX += carShiftX;
        var offsetY = random(options.carFloorSeparation) + radius*1.3;
        var offsetZ = -random(options.length);
        aOffset.push(laneX-carWidth/2, offsetY, offsetZ);
        aOffset.push(laneX+carWidth/2, offsetY, offsetZ);
        aMetrics.push(radius,length,spd, radius,length,spd);
        var color = pickRandom(colors);
        aColor.push(color.r,color.g,color.b, color.r,color.g,color.b);
      }
      instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset),3,false));
      instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics),3,false));
      instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor),3,false));
      var material = new THREE.ShaderMaterial({
        fragmentShader: carLightsFragment, vertexShader: carLightsVertex, transparent:true,
        uniforms: Object.assign({ uTime:{value:0}, uTravelLength:{value:options.length}, uFade:{value:this.fade} }, this.webgl.fogUniforms, options.distortion.uniforms)
      });
      material.onBeforeCompile = function(shader){ shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', options.distortion.getDistortion); };
      var mesh = new THREE.Mesh(instanced, material); mesh.frustumCulled=false; this.webgl.scene.add(mesh); this.mesh=mesh;
    };
    CarLights.prototype.update = function(time){ this.mesh.material.uniforms.uTime.value = time; };

    var sideSticksVertex = `
#define USE_FOG
${THREE.ShaderChunk['fog_pars_vertex']}
attribute float aOffset;
attribute vec3 aColor;
attribute vec2 aMetrics;
uniform float uTravelLength;
uniform float uTime;
varying vec3 vColor;
mat4 rotationY(in float angle){
  return mat4(cos(angle),0,sin(angle),0, 0,1.0,0,0, -sin(angle),0,cos(angle),0, 0,0,0,1);
}
#include <getDistortion_vertex>
void main(){
  vec3 transformed = position.xyz;
  float width = aMetrics.x;
  float height = aMetrics.y;
  transformed.xy *= vec2(width, height);
  float time = mod(uTime * 60. * 2. + aOffset, uTravelLength);
  transformed = (rotationY(3.14/2.) * vec4(transformed,1.)).xyz;
  transformed.z += -uTravelLength + time;
  float progress = abs(transformed.z / uTravelLength);
  transformed.xyz += getDistortion(progress);
  transformed.y += height / 2.;
  transformed.x += -width / 2.;
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
  gl_Position = projectionMatrix * mvPosition;
  vColor = aColor;
  ${THREE.ShaderChunk['fog_vertex']}
}
`;

    var sideSticksFragment = `
#define USE_FOG
${THREE.ShaderChunk['fog_pars_fragment']}
varying vec3 vColor;
void main(){
  vec3 color = vec3(vColor);
  gl_FragColor = vec4(color, 1.);
  ${THREE.ShaderChunk['fog_fragment']}
}
`;

    function LightsSticks(webgl, options){ this.webgl=webgl; this.options=options; }
    LightsSticks.prototype.init = function(){
      var options = this.options;
      var geometry = new THREE.PlaneGeometry(1,1);
      var instanced = new THREE.InstancedBufferGeometry().copy(geometry);
      var totalSticks = options.totalSideLightSticks; instanced.instanceCount = totalSticks;
      var stickoffset = options.length / (totalSticks-1);
      var aOffset=[], aColor=[], aMetrics=[];
      var colors = options.colors.sticks;
      colors = Array.isArray(colors)? colors.map(function(c){return new THREE.Color(c);}) : new THREE.Color(colors);
      for(var i=0;i<totalSticks;i++){
        var width = random(options.lightStickWidth);
        var height = random(options.lightStickHeight);
        aOffset.push((i-1)*stickoffset*2 + stickoffset*Math.random());
        var color = pickRandom(colors);
        aColor.push(color.r,color.g,color.b);
        aMetrics.push(width,height);
      }
      instanced.setAttribute('aOffset', new THREE.InstancedBufferAttribute(new Float32Array(aOffset),1,false));
      instanced.setAttribute('aColor', new THREE.InstancedBufferAttribute(new Float32Array(aColor),3,false));
      instanced.setAttribute('aMetrics', new THREE.InstancedBufferAttribute(new Float32Array(aMetrics),2,false));
      var material = new THREE.ShaderMaterial({
        fragmentShader: sideSticksFragment, vertexShader: sideSticksVertex, side: THREE.DoubleSide,
        uniforms: Object.assign({ uTravelLength:{value:options.length}, uTime:{value:0} }, this.webgl.fogUniforms, options.distortion.uniforms)
      });
      material.onBeforeCompile = function(shader){ shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', options.distortion.getDistortion); };
      var mesh = new THREE.Mesh(instanced, material); mesh.frustumCulled=false; this.webgl.scene.add(mesh); this.mesh=mesh;
    };
    LightsSticks.prototype.update = function(time){ this.mesh.material.uniforms.uTime.value = time; };

    var roadBaseFragment = `
#define USE_FOG
varying vec2 vUv;
uniform vec3 uColor;
uniform float uTime;
#include <roadMarkings_vars>
${THREE.ShaderChunk['fog_pars_fragment']}
void main() {
  vec2 uv = vUv;
  vec3 color = vec3(uColor);
  #include <roadMarkings_fragment>
  gl_FragColor = vec4(color, 1.);
  ${THREE.ShaderChunk['fog_fragment']}
}
`;
    var islandFragment = roadBaseFragment.replace('#include <roadMarkings_fragment>','').replace('#include <roadMarkings_vars>','');

    var roadMarkings_vars = `
uniform float uLanes;
uniform vec3 uBrokenLinesColor;
uniform vec3 uShoulderLinesColor;
uniform float uShoulderLinesWidthPercentage;
uniform float uBrokenLinesWidthPercentage;
uniform float uBrokenLinesLengthPercentage;
highp float random(vec2 co){
  highp float a = 12.9898;
  highp float b = 78.233;
  highp float c = 43758.5453;
  highp float dt = dot(co.xy, vec2(a,b));
  highp float sn = mod(dt, 3.14);
  return fract(sin(sn) * c);
}
`;
    var roadMarkings_fragment = `
  uv.y = mod(uv.y + uTime * 0.05, 1.);
  float laneWidth = 1.0 / uLanes;
  float brokenLineWidth = laneWidth * uBrokenLinesWidthPercentage;
  float laneEmptySpace = 1. - uBrokenLinesLengthPercentage;
  float brokenLines = step(1.0 - brokenLineWidth, fract(uv.x * 2.0)) * step(laneEmptySpace, fract(uv.y * 10.0));
  float sideLines = step(1.0 - brokenLineWidth, fract((uv.x - laneWidth * (uLanes - 1.0)) * 2.0)) + step(brokenLineWidth, uv.x);
  brokenLines = mix(brokenLines, sideLines, uv.x);
  color = mix(color, uBrokenLinesColor, brokenLines);
`;
    var roadFragment = roadBaseFragment.replace('#include <roadMarkings_fragment>', roadMarkings_fragment).replace('#include <roadMarkings_vars>', roadMarkings_vars);

    var roadVertex = `
#define USE_FOG
uniform float uTime;
${THREE.ShaderChunk['fog_pars_vertex']}
uniform float uTravelLength;
varying vec2 vUv;
#include <getDistortion_vertex>
void main() {
  vec3 transformed = position.xyz;
  vec3 distortion = getDistortion((transformed.y + uTravelLength / 2.) / uTravelLength);
  transformed.x += distortion.x;
  transformed.z += distortion.y;
  transformed.y += -1. * distortion.z;
  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.);
  gl_Position = projectionMatrix * mvPosition;
  vUv = uv;
  ${THREE.ShaderChunk['fog_vertex']}
}
`;

    function Road(webgl, options){ this.webgl=webgl; this.options=options; this.uTime={value:0}; }
    Road.prototype.createPlane = function(side, width, isRoad){
      var options = this.options; var segments = 64;
      var geometry = new THREE.PlaneGeometry(isRoad?options.roadWidth:options.islandWidth, options.length, 20, segments);
      var uniforms = {
        uTravelLength:{value:options.length},
        uColor:{value:new THREE.Color(isRoad?options.colors.roadColor:options.colors.islandColor)},
        uTime:this.uTime
      };
      if(isRoad){
        uniforms = Object.assign(uniforms, {
          uLanes:{value:options.lanesPerRoad},
          uBrokenLinesColor:{value:new THREE.Color(options.colors.brokenLines)},
          uShoulderLinesColor:{value:new THREE.Color(options.colors.shoulderLines)},
          uShoulderLinesWidthPercentage:{value:options.shoulderLinesWidthPercentage},
          uBrokenLinesLengthPercentage:{value:options.brokenLinesLengthPercentage},
          uBrokenLinesWidthPercentage:{value:options.brokenLinesWidthPercentage}
        });
      }
      var material = new THREE.ShaderMaterial({
        fragmentShader: isRoad? roadFragment : islandFragment,
        vertexShader: roadVertex, side: THREE.DoubleSide,
        uniforms: Object.assign(uniforms, this.webgl.fogUniforms, options.distortion.uniforms)
      });
      material.onBeforeCompile = function(shader){ shader.vertexShader = shader.vertexShader.replace('#include <getDistortion_vertex>', options.distortion.getDistortion); };
      var mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI/2;
      mesh.position.z = -options.length/2;
      mesh.position.x += (this.options.islandWidth/2 + options.roadWidth/2) * side;
      this.webgl.scene.add(mesh); return mesh;
    };
    Road.prototype.init = function(){
      this.leftRoadWay = this.createPlane(-1, this.options.roadWidth, true);
      this.rightRoadWay = this.createPlane(1, this.options.roadWidth, true);
      this.island = this.createPlane(0, this.options.islandWidth, false);
    };
    Road.prototype.update = function(time){ this.uTime.value = time; };

    function App(container, options){
      this.options = options;
      this.container = container;
      this.hasValidSize = false;
      var initW = Math.max(1, container.offsetWidth);
      var initH = Math.max(1, container.offsetHeight);
      this.renderer = new THREE.WebGLRenderer({antialias:false, alpha:true});
      this.renderer.setSize(initW, initH, false);
      var maxDpr = window.innerWidth < 768 ? 1 : 1.5;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      this.composer = new EffectComposer(this.renderer);
      container.append(this.renderer.domElement);
      this.camera = new THREE.PerspectiveCamera(options.fov, initW/initH, 0.1, 10000);
      this.camera.position.z = -5; this.camera.position.y = 8; this.camera.position.x = 0;
      this.scene = new THREE.Scene(); this.scene.background = null;
      var fog = new THREE.Fog(options.colors.background, options.length*0.2, options.length*500);
      this.scene.fog = fog;
      this.fogUniforms = { fogColor:{value:fog.color}, fogNear:{value:fog.near}, fogFar:{value:fog.far} };
      this.clock = new THREE.Clock(); this.assets = {}; this.disposed = false;
      this.running = false; this.raf = null;
      this.road = new Road(this, options);
      this.leftCarLights = new CarLights(this, options, options.colors.leftCars, options.movingAwaySpeed, new THREE.Vector2(0, 1-options.carLightsFade));
      this.rightCarLights = new CarLights(this, options, options.colors.rightCars, options.movingCloserSpeed, new THREE.Vector2(1, 0+options.carLightsFade));
      this.leftSticks = new LightsSticks(this, options);
      this.fovTarget = options.fov; this.speedUpTarget = 0; this.speedUp = 0; this.timeOffset = 0;
      this.tick = this.tick.bind(this);
      this.setSize = this.setSize.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onTouchStart = this.onTouchStart.bind(this);
      this.onTouchEnd = this.onTouchEnd.bind(this);
      this.onContextMenu = this.onContextMenu.bind(this);
      this.onWindowResize = this.onWindowResize.bind(this);
      window.addEventListener('resize', this.onWindowResize);
      if(container.offsetWidth>0 && container.offsetHeight>0) this.hasValidSize = true;
    }
    App.prototype.onWindowResize = function(){
      var w = this.container.offsetWidth, h = this.container.offsetHeight;
      if(w<=0||h<=0){ this.hasValidSize=false; return; }
      this.renderer.setSize(w,h); this.camera.aspect = w/h; this.camera.updateProjectionMatrix();
      this.composer.setSize(w,h); this.hasValidSize = true;
    };
    App.prototype.initPasses = function(){
      this.renderPass = new RenderPass(this.scene, this.camera);
      this.bloomPass = new EffectPass(this.camera, new BloomEffect({ luminanceThreshold:0.2, luminanceSmoothing:0, resolutionScale:0.65 }));
      var smaaPass = new EffectPass(this.camera, new SMAAEffect({ preset: SMAAPreset.LOW, searchImage: SMAAEffect.searchImageDataURL, areaImage: SMAAEffect.areaImageDataURL }));
      this.renderPass.renderToScreen = false; this.bloomPass.renderToScreen = false; smaaPass.renderToScreen = true;
      this.composer.addPass(this.renderPass); this.composer.addPass(this.bloomPass); this.composer.addPass(smaaPass);
    };
    App.prototype.loadAssets = function(){
      var assets = this.assets;
      return new Promise(function(resolve){
        var manager = new THREE.LoadingManager(resolve);
        var searchImage = new Image(), areaImage = new Image();
        assets.smaa = {};
        searchImage.addEventListener('load', function(){ assets.smaa.search = this; manager.itemEnd('smaa-search'); });
        areaImage.addEventListener('load', function(){ assets.smaa.area = this; manager.itemEnd('smaa-area'); });
        manager.itemStart('smaa-search'); manager.itemStart('smaa-area');
        searchImage.src = SMAAEffect.searchImageDataURL; areaImage.src = SMAAEffect.areaImageDataURL;
      });
    };
    App.prototype.init = function(){
      this.initPasses();
      var options = this.options;
      this.road.init();
      this.leftCarLights.init(); this.leftCarLights.mesh.position.setX(-options.roadWidth/2 - options.islandWidth/2);
      this.rightCarLights.init(); this.rightCarLights.mesh.position.setX(options.roadWidth/2 + options.islandWidth/2);
      this.leftSticks.init(); this.leftSticks.mesh.position.setX(-(options.roadWidth + options.islandWidth/2));
      this.container.addEventListener('mousedown', this.onMouseDown);
      this.container.addEventListener('mouseup', this.onMouseUp);
      this.container.addEventListener('mouseout', this.onMouseUp);
      this.container.addEventListener('touchstart', this.onTouchStart, {passive:true});
      this.container.addEventListener('touchend', this.onTouchEnd, {passive:true});
      this.container.addEventListener('touchcancel', this.onTouchEnd, {passive:true});
      this.container.addEventListener('contextmenu', this.onContextMenu);
      this.start();
    };
    App.prototype.onMouseDown = function(ev){ if(this.options.onSpeedUp) this.options.onSpeedUp(ev); this.fovTarget = this.options.fovSpeedUp; this.speedUpTarget = this.options.speedUp; };
    App.prototype.onMouseUp = function(ev){ if(this.options.onSlowDown) this.options.onSlowDown(ev); this.fovTarget = this.options.fov; this.speedUpTarget = 0; };
    App.prototype.onTouchStart = function(ev){ if(this.options.onSpeedUp) this.options.onSpeedUp(ev); this.fovTarget = this.options.fovSpeedUp; this.speedUpTarget = this.options.speedUp; };
    App.prototype.onTouchEnd = function(ev){ if(this.options.onSlowDown) this.options.onSlowDown(ev); this.fovTarget = this.options.fov; this.speedUpTarget = 0; };
    App.prototype.onContextMenu = function(ev){ ev.preventDefault(); };
    App.prototype.update = function(delta){
      var lerpPercentage = Math.exp(-(-60*Math.log2(1-0.1))*delta);
      this.speedUp += lerp(this.speedUp, this.speedUpTarget, lerpPercentage, 0.00001);
      this.timeOffset += this.speedUp * delta;
      var time = this.clock.elapsedTime + this.timeOffset;
      this.rightCarLights.update(time); this.leftCarLights.update(time); this.leftSticks.update(time); this.road.update(time);
      var updateCamera = false;
      var fovChange = lerp(this.camera.fov, this.fovTarget, lerpPercentage);
      if(fovChange !== 0){ this.camera.fov += fovChange*delta*6; updateCamera = true; }
      if(this.options.distortion.getJS){
        var distortion = this.options.distortion.getJS(0.025, time);
        this.camera.lookAt(new THREE.Vector3(this.camera.position.x + distortion.x, this.camera.position.y + distortion.y, this.camera.position.z + distortion.z));
        updateCamera = true;
      }
      if(updateCamera) this.camera.updateProjectionMatrix();
    };
    App.prototype.render = function(delta){ this.composer.render(delta); };
    App.prototype.setSize = function(w,h,updateStyles){ if(w<=0||h<=0){ this.hasValidSize=false; return; } this.composer.setSize(w,h,updateStyles); this.hasValidSize = true; };
    App.prototype.dispose = function(){
      this.disposed = true;
      this.stop();
      try{ window.removeEventListener('resize', this.onWindowResize); }catch(e){}
      if(this.container){
        try{
          this.container.removeEventListener('mousedown', this.onMouseDown);
          this.container.removeEventListener('mouseup', this.onMouseUp);
          this.container.removeEventListener('mouseout', this.onMouseUp);
          this.container.removeEventListener('touchstart', this.onTouchStart);
          this.container.removeEventListener('touchend', this.onTouchEnd);
          this.container.removeEventListener('touchcancel', this.onTouchEnd);
          this.container.removeEventListener('contextmenu', this.onContextMenu);
        }catch(e){}
      }
      try{
        if(this.scene){
          this.scene.traverse(function(obj){
            if(!obj.isMesh) return;
            if(obj.geometry) obj.geometry.dispose();
            if(obj.material){
              if(Array.isArray(obj.material)) obj.material.forEach(function(m){m.dispose();});
              else obj.material.dispose();
            }
          });
          this.scene.clear();
        }
      }catch(e){}
      try{ if(this.composer) this.composer.dispose(); }catch(e){}
      try{
        if(this.renderer){
          this.renderer.dispose();
          this.renderer.forceContextLoss();
          if(this.renderer.domElement && this.renderer.domElement.parentNode){
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
          }
        }
      }catch(e){}
    };
    App.prototype.start = function(){
      if(this.disposed || this.running) return;
      this.running = true;
      this.clock.getDelta();
      this.tick();
    };
    App.prototype.stop = function(){
      this.running = false;
      if(this.raf){ cancelAnimationFrame(this.raf); this.raf = null; }
    };
    App.prototype.tick = function(){
      if(this.disposed || !this.running) return;
      if(!this.hasValidSize){
        var w = this.container.offsetWidth, h = this.container.offsetHeight;
        if(w>0 && h>0){ this.renderer.setSize(w,h,false); this.camera.aspect = w/h; this.camera.updateProjectionMatrix(); this.composer.setSize(w,h); this.hasValidSize = true; }
        else { this.raf = requestAnimationFrame(this.tick); return; }
      }
      var canvas = this.renderer.domElement;
      var width = canvas.clientWidth, height = canvas.clientHeight;
      if(width>0 && height>0 && (canvas.width!==width || canvas.height!==height)){
        this.setSize(width,height,false);
        this.camera.aspect = canvas.clientWidth/canvas.clientHeight; this.camera.updateProjectionMatrix();
      }
      if(this.hasValidSize){
        var delta = this.clock.getDelta();
        this.render(delta); this.update(delta);
      }
      this.raf = requestAnimationFrame(this.tick);
    };

    function mount(){
      var container = document.getElementById('hyperspeed-root');
      if(!container) return;
      var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      if(prefersReduced){
        var t = document.documentElement.getAttribute('data-theme') || 'dark';
        container.style.background = t === 'light'
          ? 'radial-gradient(ellipse at center bottom, #e9eef4 0%, #f4f6fa 60%, #FAFAFA 100%)'
          : 'radial-gradient(ellipse at center bottom, #0e2a4d 0%, #0a1020 60%, #0A0A0A 100%)';
        return;
      }
      var app = null;
      function buildOptions(){
        var o = Object.assign({}, BASE_OPTIONS);
        o.colors = getColors();
        o.distortion = distortions[o.distortion || 'turbulentDistortion'];
        return o;
      }
      function spawn(){
        if(app){ try{ app.dispose && app.dispose(); }catch(e){} app=null; }
        while(container.firstChild){ container.removeChild(container.firstChild); }
        var options = buildOptions();
        // sync the hero box bg with theme so any letterboxing matches
        container.style.background = (document.documentElement.getAttribute('data-theme')==='light') ? '#FAFAFA' : '#0A0A0A';
        app = new App(container, options);
        app.loadAssets().then(function(){ if(!app.disposed) app.init(); });
      }
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){
            if(!app) spawn();
            else app.start();
          } else if(app){
            app.stop();
          }
        });
      }, {rootMargin:'120px'});
      io.observe(container);

      // rebuild on theme change
      var mo = new MutationObserver(function(muts){
        muts.forEach(function(m){
          if(m.attributeName === 'data-theme' && app){ spawn(); }
        });
      });
      mo.observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount);
    else mount();
  }

  function loadDeps(){
    if(window.__hyperspeedDeps) return Promise.resolve(window.__hyperspeedDeps);
    if(window.__hyperspeedDepsPromise) return window.__hyperspeedDepsPromise;
    window.__hyperspeedDepsPromise = Promise.all([
      import('https://esm.sh/three@0.160.0'),
      import('https://esm.sh/postprocessing@6.34.2?deps=three@0.160.0')
    ]).then(function(mods){
      window.__hyperspeedDeps = { THREE: mods[0], PP: mods[1] };
      return window.__hyperspeedDeps;
    });
    return window.__hyperspeedDepsPromise;
  }

  function bootWhenNear(){
    var container = document.getElementById('hyperspeed-root');
    if(!container) return;
    function boot(){
      loadDeps().then(function(deps){ start(deps.THREE, deps.PP); }).catch(function(){});
    }
    if(!('IntersectionObserver' in window)){
      boot();
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        io.disconnect();
        boot();
      });
    }, {rootMargin:'360px'});
    io.observe(container);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bootWhenNear);
  else bootWhenNear();
})();
