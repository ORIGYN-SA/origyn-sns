/* Vault decrypt-on-hover — descriptions only, titles always plain */
(function(){
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>+=/\\|';
  var HEX = '0123456789abcdef';
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vaultVisible = false;

  function watchVaultVisibility(){
    var vault = document.getElementById('vault');
    if(!vault){ vaultVisible = true; return; }
    if(!('IntersectionObserver' in window)){ vaultVisible = true; return; }
    new IntersectionObserver(function(entries){
      vaultVisible = entries.some(function(entry){ return entry.isIntersecting; });
    }, {rootMargin:'160px'}).observe(vault);
  }

  function rand(){ return CHARS[Math.floor(Math.random()*CHARS.length)]; }
  function randHex(n){ var s=''; for(var i=0;i<n;i++) s+=HEX[Math.floor(Math.random()*16)]; return s; }
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function captureOriginal(el){
    /* Always read fresh from i18n key when available so we never capture scrambled state */
    var key = el.getAttribute('data-i18n');
    if(key && window.__i18n && window.__i18n[window.__currentLang||'en'] && window.__i18n[window.__currentLang||'en'][key]){
      el.__decryptOriginal = window.__i18n[window.__currentLang||'en'][key];
    } else if(!el.__decryptOriginal || el.querySelector('.dx-c')){
      /* fallback: only capture textContent if not already scrambled */
      if(!el.querySelector('.dx-c')) el.__decryptOriginal = el.textContent;
    }
    if(!el.__decryptOriginal) el.__decryptOriginal = el.textContent;
  }

  function init(el){
    captureOriginal(el);
    renderEncrypted(el);
  }

  function renderEncrypted(el){
    var orig = el.__decryptOriginal || '';
    var html = '';
    for(var i=0;i<orig.length;i++){
      var c = orig[i];
      if(c === ' ' || c === '\n' || c === '\t'){ html += c; }
      else { html += '<span class="dx-c dx-enc">' + escapeHtml(rand()) + '</span>'; }
    }
    el.innerHTML = html;
    el.__decryptState = 'encrypted';
  }

  function ambientScrambleStep(el){
    if(el.__decryptState !== 'encrypted') return;
    var spans = el.querySelectorAll('.dx-c.dx-enc');
    if(!spans.length) return;
    var n = Math.max(1, Math.floor(spans.length * 0.06));
    for(var i=0;i<n;i++){
      var s = spans[Math.floor(Math.random()*spans.length)];
      s.textContent = rand();
    }
  }

  function decrypt(el, opts){
    if(prefersReduced){ el.textContent = el.__decryptOriginal; el.__decryptState='decrypted'; return; }
    if(el.__decryptTimer){ clearInterval(el.__decryptTimer); el.__decryptTimer=null; }
    if(el.__scrambleTimer){ clearInterval(el.__scrambleTimer); el.__scrambleTimer=null; }
    opts = opts || {};
    var speed = opts.speed || 12;
    var orig = el.__decryptOriginal;
    renderEncrypted(el);
    var spans = el.querySelectorAll('.dx-c');
    var nodes = []; var ci = 0;
    for(var i=0;i<orig.length;i++){
      var c = orig[i];
      if(c===' '||c==='\n'||c==='\t') continue;
      nodes[i] = spans[ci++];
    }
    el.__decryptState = 'animating';
    el.__scrambleTimer = setInterval(function(){
      for(var k=0;k<orig.length;k++){
        var n = nodes[k];
        if(n && !n.classList.contains('dx-rev')) n.textContent = rand();
      }
    }, 35);
    var revealed = 0;
    el.__decryptTimer = setInterval(function(){
      while(revealed < orig.length && (orig[revealed]===' '||orig[revealed]==='\n'||orig[revealed]==='\t')) revealed++;
      if(revealed >= orig.length){
        clearInterval(el.__decryptTimer); el.__decryptTimer=null;
        clearInterval(el.__scrambleTimer); el.__scrambleTimer=null;
        el.__decryptState = 'decrypted';
        return;
      }
      var n = nodes[revealed];
      if(n){ n.textContent = orig[revealed]; n.classList.remove('dx-enc'); n.classList.add('dx-rev'); }
      revealed++;
    }, speed);
  }

  function reEncrypt(el){
    if(el.__decryptTimer){ clearInterval(el.__decryptTimer); el.__decryptTimer=null; }
    if(el.__scrambleTimer){ clearInterval(el.__scrambleTimer); el.__scrambleTimer=null; }
    captureOriginal(el);
    renderEncrypted(el);
  }

  function ensureChrome(card){
    if(card.__chromeReady) return;
    card.__chromeReady = true;
    var badge = document.createElement('div');
    badge.className = 'vault__badge';
    badge.innerHTML = '<span class="vault__badge-dot"></span><span class="vault__badge-text">ENCRYPTED</span><span class="vault__badge-hash">'+randHex(6)+'</span>';
    card.appendChild(badge);
    card.__badge = badge;
    var scan = document.createElement('div'); scan.className = 'vault__scan'; card.appendChild(scan);
    var corners = document.createElement('div');
    corners.className = 'vault__corners';
    corners.innerHTML = '<span class="vc vc--tl"></span><span class="vc vc--tr"></span><span class="vc vc--bl"></span><span class="vc vc--br"></span>';
    card.appendChild(corners);
  }

  function setBadgeVerified(card){
    if(!card.__badge) return;
    card.__badge.classList.add('is-verified');
    card.__badge.querySelector('.vault__badge-text').textContent = 'VERIFIED';
    card.__badge.querySelector('.vault__badge-hash').textContent = '0x'+randHex(6);
  }
  function setBadgeEncrypted(card){
    if(!card.__badge) return;
    card.__badge.classList.remove('is-verified');
    card.__badge.querySelector('.vault__badge-text').textContent = 'ENCRYPTED';
    card.__badge.querySelector('.vault__badge-hash').textContent = randHex(6);
  }

  function getDescs(){
    return Array.prototype.slice.call(document.querySelectorAll('.vault__feature-desc'));
  }

  function setup(){
    getDescs().forEach(init);
    document.querySelectorAll('.vault__feature').forEach(function(card){
      ensureChrome(card);
      card.addEventListener('mouseenter', function(){
        card.classList.add('is-decrypting');
        setBadgeVerified(card);
        var desc = card.querySelector('.vault__feature-desc');
        if(desc) decrypt(desc, {speed: 9});
      });
      card.addEventListener('mouseleave', function(){
        card.classList.remove('is-decrypting');
        setBadgeEncrypted(card);
        var desc = card.querySelector('.vault__feature-desc');
        if(desc) reEncrypt(desc);
      });
    });
    if(!prefersReduced){
      setInterval(function(){
        if(!vaultVisible || document.hidden) return;
        getDescs().forEach(ambientScrambleStep);
      }, 360);
    }
  }

  function rebindOnLang(){
    document.addEventListener('i18n:changed', function(){
      getDescs().forEach(function(el){
        if(el.__decryptTimer){ clearInterval(el.__decryptTimer); el.__decryptTimer=null; }
        if(el.__scrambleTimer){ clearInterval(el.__scrambleTimer); el.__scrambleTimer=null; }
        /* Re-read original from i18n source — el.textContent at this moment is scrambled garbage */
        captureOriginal(el);
        renderEncrypted(el);
      });
      document.querySelectorAll('.vault__feature').forEach(function(card){
        if(card.matches(':hover')){
          var desc = card.querySelector('.vault__feature-desc');
          if(desc) decrypt(desc, {speed: 9});
        } else {
          card.classList.remove('is-decrypting');
          setBadgeEncrypted(card);
        }
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ watchVaultVisibility(); setup(); rebindOnLang(); });
  } else {
    watchVaultVisibility(); setup(); rebindOnLang();
  }
})();
