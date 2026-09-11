(function(global){
  "use strict";
  const OWNED_HOSTS=new Set(["shareshuffle.com","www.shareshuffle.com","shfl.me","www.shfl.me","tempofoundry.com","www.tempofoundry.com","butchbreger.com","www.butchbreger.com","eternalroute66.com","www.eternalroute66.com","duetloop.com","www.duetloop.com","metromance.com","www.metromance.com","localhost","127.0.0.1"]);
  const AMAZON_TAG="shareshuffle-20";
  const AMAZON_HOST=/^(?:www\.)?amazon\.(?:com|ca|com\.mx|co\.uk|de|fr|it|es|co\.jp|com\.au)$/i;
  const CLUTTER=["ref","ref_","qid","sr","keywords","crid","sprefix","dib","dib_tag","pf_rd_p","pf_rd_r","pd_rd_w","pd_rd_wg","pd_rd_r"];
  function parse(raw){try{return new URL(String(raw||"").trim())}catch(_){return null}}
  function asin(url){const m=url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})(?:[/?]|$)/i);return m?m[1].toUpperCase():""}
  function hostAllowed(host){host=String(host||"").toLowerCase();return OWNED_HOSTS.has(host)}
  function analyze(raw,opts={}){
    const pageHost=String(opts.pageHost||global.location?.hostname||"").toLowerCase();
    const u=parse(raw); const out={input:String(raw||""),health:"healthy",merchant:"unknown",issues:[],notices:[],existingTag:"",suggestedUrl:"",productId:"",monetization:"none",canAutoFix:false};
    if(!u||!/^https?:$/.test(u.protocol)){out.health="unsafe";out.issues.push("This is not a valid public http/https link.");return out}
    out.suggestedUrl=u.href;
    if(/^(?:www\.)?(?:a\.co|amzn\.to)$/i.test(u.hostname)){out.merchant="amazon";out.health="needs-help";out.issues.push("This is a shortened Amazon link. Open it first so Shuffle can verify the final product and preserve attribution.");return out}
    if(!AMAZON_HOST.test(u.hostname)){out.health="healthy";out.notices.push("No Amazon-specific compliance changes are needed.");return out}
    out.merchant="amazon";out.productId=asin(u);out.existingTag=u.searchParams.get("tag")||"";
    if(/\/(?:gp\/cart|gp\/buy|hz\/wishlist|ap\/signin|your-account|checkout)/i.test(u.pathname)){out.health="unsafe";out.issues.push("This appears to be a private account, cart, checkout or sign-in link. Share a public product page instead.");return out}
    if(u.pathname==="/s"||u.searchParams.has("k")||u.searchParams.has("rh")){out.health="cleanable";out.issues.push("This is an Amazon search or brand page, not one specific product. It can be used as a collection link, but Shuffle should label it clearly.")}
    if(!out.productId && u.pathname!=="/s"){out.health="needs-help";out.issues.push("Shuffle could not find an Amazon product ID in this link.")}
    const before=u.href; CLUTTER.forEach(k=>u.searchParams.delete(k));
    if(out.existingTag){u.searchParams.set("tag",out.existingTag);out.monetization="preserve-publisher";out.notices.push("Existing Amazon Associate attribution detected and preserved.")}
    else if(hostAllowed(pageHost)){u.searchParams.set("tag",AMAZON_TAG);out.monetization="shareshuffle-owned-site";out.notices.push("This is a normal Amazon product link. When you create the share, Shuffle will use the clean product URL and add its disclosed Associate tag.")}
    else {u.searchParams.delete("tag");out.monetization="untagged-external-site";out.notices.push("No publisher tag was supplied. Shuffle will not silently attach its tag on an unknown third-party site.")}
    out.suggestedUrl=u.href; out.canAutoFix=before!==u.href;
    if(out.health==="unsafe"||out.health==="needs-help") return out;
    if(out.canAutoFix){out.health="cleanable";out.issues.push("The link contains removable tracking clutter or needs compliant affiliate handling.")}
    else if(out.health!=="cleanable") out.health="healthy";
    return out;
  }
  function disclosure(result){return result?.monetization==="shareshuffle-owned-site"?"Commissions earned: ShareShuffle may earn from qualifying purchases at no additional cost to you.":result?.existingTag?"Affiliate attribution detected and preserved.":""}
  global.ShuffleLinkCheck={analyze,disclosure,ownedHosts:Array.from(OWNED_HOSTS),associateTag:AMAZON_TAG};
})(window);
