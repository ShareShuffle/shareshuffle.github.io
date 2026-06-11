(function(){
  if (window.__SS_SKELETON_LOADED__ || document.documentElement.dataset.noSkeleton === "true") return;
  window.__SS_SKELETON_LOADED__ = true;
  var started = Date.now();
  var minMs = 450;
  var maxMs = 5500;
  var skeleton = document.createElement("div");
  skeleton.className = "ss-auto-skeleton";
  skeleton.setAttribute("aria-hidden", "true");
  skeleton.innerHTML = '<div class="ss-skeleton-card"><div class="ss-skeleton-thumb"></div><div class="ss-skeleton-line long"></div><div class="ss-skeleton-line med"></div><div class="ss-skeleton-line short"></div><div class="ss-skeleton-pill"></div></div>';
  function attach(){ if (document.body && !document.querySelector(".ss-auto-skeleton")) document.body.prepend(skeleton); }
  function remove(){
    attach();
    var delay = Math.max(0, minMs - (Date.now() - started));
    setTimeout(function(){
      skeleton.classList.add("ss-skeleton-done");
      setTimeout(function(){ skeleton.remove(); }, 260);
    }, delay);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", attach, { once:true }); else attach();
  window.addEventListener("load", remove, { once:true });
  setTimeout(remove, maxMs);
})();
