/* ============================================================
   FLYNEW SHILAJIT ULTRA — lógica de la landing
   ============================================================ */
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwtAGeI0KObN_6cJjrccrCGVJgMhkHX7Ny4P4rC7pZ7Z9dM6N-0tlmPWxJMA9PDICe-/exec";
const PRODUCTO = "Polvo Limpiador DRAINPRO";
const DROPI_ID = "69746";   // ID del producto DRAINPRO en Dropi
const N8N_CONFIRM = "https://n8n-production-8a42.up.railway.app/webhook/d4f51138-9611-4f93-9c51-e137fea97dcc"; // confirmación WhatsApp
const PANEL_URL = "https://script.google.com/macros/s/AKfycbwRayJ1bThod83lMlvOWSdE8MAedTPLbaxIcrDN301PYUk7SWZoen6pFE5rScYiuvra/exec"; // panel: visitas/conversión
const clp = n => "$" + Math.round(n).toLocaleString("es-CL");

/* ---------- Contador de visitas (para el panel) ---------- */
function trackPanel(tipo){
  if(!PANEL_URL) return;
  try{ fetch(PANEL_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({tipo:tipo})}).catch(function(){}); }catch(e){}
}
// una visita por sesión (no recuenta si recarga en la misma pestaña)
try{ if(!sessionStorage.getItem("jaye_vis")){ sessionStorage.setItem("jaye_vis","1"); trackPanel("visita"); } }catch(e){ trackPanel("visita"); }

/* ---------- Píxel de Meta (helper seguro) ---------- */
function fb(evento, datos){ if(window.fbq){ try{ fbq("track", evento, datos || {}); }catch(e){} } }
/* ---------- Píxel de TikTok (helper seguro) ---------- */
function tt(evento, datos){ if(window.ttq){ try{ ttq.track(evento, datos || {}); }catch(e){} } }
// ViewContent al cargar la página de producto
fb("ViewContent", { content_name: PRODUCTO, content_ids: ["drainpro"], content_type: "product", value: 17000, currency: "CLP" });
tt("ViewContent", { content_id: "drainpro", content_name: PRODUCTO, content_type: "product", value: 17000, currency: "CLP" });
var _checkoutTracked = false;

/* ---------- Scroll suave + cantidad preseleccionada ---------- */
function irAlObjetivo(sel){
  var el=document.querySelector(sel); if(!el) return;
  var head=document.querySelector(".header");
  var off=(head?head.offsetHeight:0)+8;
  function go(b){ window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: b }); }
  go("smooth");
  setTimeout(function(){ go("smooth"); }, 400);   // re-corrige el salto por imágenes que cargan tarde
  setTimeout(function(){ go("auto"); }, 900);
}
document.querySelectorAll("[data-scroll]").forEach(b=>{
  b.addEventListener("click",()=>{
    if(b.dataset.qty) selectPack(b.dataset.qty);
    irAlObjetivo(b.dataset.scroll);
    var m=document.getElementById("menu"); if(m) m.hidden=true;   // cerrar menú si está abierto
    // InitiateCheckout al tocar un botón de compra (una sola vez)
    if(b.dataset.scroll === "#pedido" && !_checkoutTracked){
      _checkoutTracked = true;
      var p = (typeof current!=="undefined" && current) ? parseInt(current.dataset.price,10) : 17000;
      fb("InitiateCheckout", { content_name: PRODUCTO, value: p, currency: "CLP" });
      tt("InitiateCheckout", { content_id: "drainpro", content_name: PRODUCTO, value: p, currency: "CLP" });
      trackPanel("visita_form");   // llegó al formulario
    }
  });
});

/* ---------- Menú desplegable (☰) ---------- */
(function(){
  var ham=document.getElementById("hamBtn"), menu=document.getElementById("menu");
  if(!ham||!menu) return;
  ham.addEventListener("click",function(e){ e.stopPropagation(); menu.hidden=!menu.hidden; });
  menu.querySelectorAll("a[href]").forEach(function(a){ a.addEventListener("click",function(){ menu.hidden=true; }); });
  document.addEventListener("click",function(e){ if(!menu.hidden && !menu.contains(e.target) && e.target!==ham) menu.hidden=true; });
})();

/* ---------- Packs + resumen ---------- */
const packs = [...document.querySelectorAll("#packs .pack")];
let current = packs.find(p=>p.classList.contains("sel")) || packs[1] || packs[0];
function selectPack(qty){
  const p = packs.find(x=>x.dataset.qty===String(qty));
  if(!p) return;
  packs.forEach(x=>x.classList.remove("sel"));
  p.classList.add("sel");
  current = p;
  refresh();
}
packs.forEach(p=>{
  p.addEventListener("click",e=>{ e.preventDefault(); selectPack(p.dataset.qty); });
});
function refresh(){
  const qty = parseInt(current.dataset.qty,10);
  const price = parseInt(current.dataset.price,10);   // total a pagar
  const sub = 17000 * qty;                            // precio lista
  const disc = sub - price;
  document.getElementById("sumSub").textContent = clp(sub);
  document.getElementById("sumDisc").textContent = "-" + clp(disc);
  document.getElementById("sumTot").textContent = clp(price);
  var cc = document.getElementById("cartCount");
  if(cc) cc.textContent = qty;
}
refresh();

/* ---------- Regiones / Comunas ---------- */
const regionSel = document.getElementById("region");
const comunaSel = document.getElementById("comuna");
Object.keys(window.CHILE_REGIONES||{}).forEach(r=>{
  const o=document.createElement("option"); o.value=r; o.textContent=r; regionSel.appendChild(o);
});
regionSel.addEventListener("change",()=>{
  comunaSel.innerHTML='<option value="">Selecciona…</option>';
  const cs = window.CHILE_REGIONES[regionSel.value]||[];
  cs.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;comunaSel.appendChild(o);});
  comunaSel.disabled = cs.length===0;
});

/* ---------- Countdown evergreen (2 días, se reinicia solo) ---------- */
(function(){
  const DUR=2*24*60*60*1000;
  let end=parseInt(localStorage.getItem("cd_end")||"0",10);
  const now=Date.now();
  if(!end||end<now){ end=now+DUR; localStorage.setItem("cd_end",end); }
  const d=document.getElementById("cd-d"),h=document.getElementById("cd-h"),m=document.getElementById("cd-m"),s=document.getElementById("cd-s");
  function tick(){
    let left=end-Date.now();
    if(left<=0){ end=Date.now()+DUR; localStorage.setItem("cd_end",end); left=DUR; }  // termina → reinicia
    const dd=Math.floor(left/8.64e7), hh=Math.floor(left%8.64e7/3.6e6), mm=Math.floor(left%3.6e6/6e4), ss=Math.floor(left%6e4/1e3);
    d.textContent=String(dd).padStart(2,"0");h.textContent=String(hh).padStart(2,"0");
    m.textContent=String(mm).padStart(2,"0");s.textContent=String(ss).padStart(2,"0");
  }
  tick(); setInterval(tick,1000);
})();

/* ---------- Carrusel con auto-deslizamiento ---------- */
(function(){
  var car = document.querySelector(".carousel");
  if(!car) return;
  var cards = [].slice.call(car.querySelectorAll(".imgcard"));
  if(cards.length < 2) return;
  if(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var i = 0, paused = false, resume;
  var base = function(){ return cards[0].offsetLeft; };
  function go(){
    if(paused || document.hidden) return;
    i = (i + 1) % cards.length;
    car.scrollTo({ left: cards[i].offsetLeft - base(), behavior: "smooth" });
  }
  setInterval(go, 3000);
  ["pointerdown","touchstart","wheel"].forEach(function(ev){
    car.addEventListener(ev, function(){
      paused = true; clearTimeout(resume);
      resume = setTimeout(function(){
        // sincronizar el índice con la tarjeta visible actual
        var best = 0, bd = 1e9;
        cards.forEach(function(c, idx){
          var d = Math.abs((c.offsetLeft - base()) - car.scrollLeft);
          if(d < bd){ bd = d; best = idx; }
        });
        i = best; paused = false;
      }, 4500);
    }, {passive:true});
  });
})();

/* ---------- Sticky CTA ---------- */
(function(){
  const bar=document.getElementById("stickycta"), form=document.getElementById("pedido");
  window.addEventListener("scroll",()=>{
    const ft=form.getBoundingClientRect().top;
    bar.classList.toggle("show", window.scrollY>520 && ft>window.innerHeight*0.5);
  },{passive:true});
})();

/* ---------- RESEÑAS ---------- */
(function(){
  var list = document.getElementById("revList");
  if(!list) return;
  var NAMES = ["José Muñoz","María González","Camila Rojas","Matías Soto","Javiera Díaz","Felipe Contreras","Catalina Pérez","Sebastián Silva","Antonia Martínez","Vicente Sepúlveda","Fernanda Morales","Diego Rodríguez","Valentina López","Cristóbal Fuentes","Daniela Hernández","Ignacio Torres","Constanza Araya","Benjamín Flores","Francisca Espinoza","Tomás Valenzuela","Josefa Castillo","Martín Tapia","Isidora Reyes","Agustín Gutiérrez","Trinidad Castro","Joaquín Vargas","Florencia Álvarez","Maximiliano Vásquez","Emilia Sánchez","Vicente Fernández","Gabriela Gómez","Rodrigo Cortés","Paula Herrera","Andrés Núñez","Carolina Pizarro","Cristián Bravo","Macarena Cáceres","Nicolás Vera","Bárbara Riquelme","Álvaro Saavedra","Pía Carrasco","Mauricio Lagos","Romina Salazar","Esteban Ramírez","Javier Aguilera","Catalina Navarro","Pedro Fuentealba","Karen Ortega","Luis Henríquez","Marcela Cárdenas"];
  var TEXTS = ["Tenía el lavaplatos tapado hace días y lo destapó en minutos.","Increíble, adiós al mal olor de la cocina. Lo recomiendo 100%.","Llegó rápido y el pago contra entrega facilitó todo.","Funciona de verdad, me ahorré el plomero.","Lo usé en la ducha que estaba lenta y quedó como nueva.","Pedí el pack de 6 y nos sirvió para toda la casa.","Desató la cañería del baño sin dañar nada. Excelente.","Llegó a regiones sin problema, muy buena atención.","Lo tenía guardado para emergencias y me salvó.","No daña las tuberías, eso es lo que más me gustó.","El inodoro estaba tapado y con esto quedó destapado al toque.","La verdad sí funciona, repito sin duda.","Despacho rápido y producto de calidad.","Lo compré desconfiado y quedé sorprendido del resultado.","Fácil de usar, solo polvo y agua caliente.","Se fue el mal olor del desagüe por completo.","Mejor que los destapadores líquidos que probé antes."];
  var SEED = [];
  for(var k=0;k<110;k++){
    var st = (k%12===5)?4 : (k%37===9?3:5);
    var dd = String((k*7)%28+1).padStart(2,"0");
    var mm = String((k%6)+1).padStart(2,"0");
    SEED.push({ name:NAMES[k%NAMES.length], stars:st, ver:(k%3===0), text:TEXTS[k%TEXTS.length], date:dd+"/"+mm+"/2026" });
  }
  // algunas reseñas con foto real del cliente (producto recibido)
  var REVIMGS = ["img/resena3.avif","img/resena5.avif","img/resena6.avif","img/resena7.avif","img/resena1.avif","img/resena2.avif","img/resena4.avif"];
  var imgSpots = [1,4,9,15,22,31,44];
  for(var j=0;j<imgSpots.length;j++){ if(SEED[imgSpots[j]]){ SEED[imgSpots[j]].img = REVIMGS[j]; SEED[imgSpots[j]].stars = 5; } }
  var KEY = "reviews_drainpro_v1";
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"[]"); }catch(e){ return []; } }
  function save(arr){ try{ localStorage.setItem(KEY, JSON.stringify(arr)); }catch(e){} }
  function stars(n){ var s=""; for(var i=1;i<=5;i++){ s += i<=n ? "★" : '<span class="off">★</span>'; } return s; }
  function av(name){ return (name||"?").trim().charAt(0).toUpperCase(); }
  function card(r){
    return '<div class="rev"><div class="top"><span class="av">'+av(r.name)+'</span>'+
      '<div><div class="who">'+r.name+(r.ver?'<span class="ver">✓ Verificado</span>':'')+'</div>'+
      '<div class="date">'+r.date+'</div></div></div>'+
      '<div class="st">'+stars(r.stars)+'</div><p>'+r.text+'</p>'+
      (r.img?'<img class="rimg" src="'+r.img+'" loading="lazy" alt="Foto reseña">':'')+'</div>';
  }
  function render(){
    var all = load().concat(SEED);
    // 6 en el cuadro principal
    list.innerHTML = all.slice(0, 6).map(card).join("");
    // el resto se desliza solo (duplicado para loop continuo)
    var rest = all.slice(6);
    var auto = document.getElementById("revAuto");
    if(auto){ auto.innerHTML = (rest.concat(rest)).map(card).join(""); }
    document.getElementById("revCount").textContent = 110 + load().length;
  }
  render();

  /* Modal */
  var modal = document.getElementById("revModal");
  var rating = 0;
  var picks = [].slice.call(document.querySelectorAll("#starPick span"));
  function paint(n){ picks.forEach(function(s,i){ s.classList.toggle("on", i < n); }); }
  picks.forEach(function(s){
    s.addEventListener("click", function(){ rating = +s.dataset.v; paint(rating); });
    s.addEventListener("mouseenter", function(){ paint(+s.dataset.v); });
  });
  document.getElementById("starPick").addEventListener("mouseleave", function(){ paint(rating); });
  document.getElementById("btnWrite").addEventListener("click", function(){ modal.hidden=false; });
  document.getElementById("revClose").addEventListener("click", function(){ modal.hidden=true; });
  modal.addEventListener("click", function(e){ if(e.target===modal) modal.hidden=true; });

  document.getElementById("revSubmit").addEventListener("click", function(){
    var name = document.getElementById("revName").value.trim();
    var text = document.getElementById("revText").value.trim();
    var msg = document.getElementById("revMsg");
    if(!rating){ msg.style.color="#ee1c25"; msg.textContent="Elige cuántas estrellas."; return; }
    if(name.length<2 || text.length<3){ msg.style.color="#ee1c25"; msg.textContent="Escribe tu nombre y tu reseña."; return; }
    var hoy = new Date();
    var review = { name:name, text:text, stars:rating, ver:false,
      date: String(hoy.getDate()).padStart(2,"0")+"/"+String(hoy.getMonth()+1).padStart(2,"0")+"/"+hoy.getFullYear() };
    // guardar local + mostrar al instante
    var mine = load(); mine.unshift(review); save(mine);
    render();
    // enviar al Google Sheet (si está configurado)
    if(typeof SHEET_URL!=="undefined" && SHEET_URL){
      fetch(SHEET_URL, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain;charset=utf-8"},
        body: JSON.stringify({tipo:"resena", producto:PRODUCTO, nombre:name, estrellas:rating, resena:text, fecha:review.date})}).catch(function(){});
    }
    msg.style.color="var(--teal)"; msg.textContent="¡Gracias! Tu reseña se publicó. 🎉";
    document.getElementById("revName").value=""; document.getElementById("revText").value="";
    rating=0; paint(0);
    setTimeout(function(){ modal.hidden=true; msg.textContent=""; document.getElementById("resenas").scrollIntoView({behavior:"smooth"}); }, 1200);
  });
})();

/* ---------- Selector de código de país (banderas) ---------- */
(function(){
  var cc=document.getElementById("cc"); if(!cc) return;
  var btn=document.getElementById("ccBtn"), list=document.getElementById("ccList"),
      flag=document.getElementById("ccFlag"), code=document.getElementById("ccCode"),
      hidden=document.getElementById("codpais");
  btn.addEventListener("click",function(e){ e.stopPropagation(); list.hidden=!list.hidden; });
  list.querySelectorAll("button").forEach(function(b){
    b.addEventListener("click",function(){
      hidden.value=b.dataset.code;
      flag.src="https://flagcdn.com/"+b.dataset.cc+".svg";
      code.textContent=b.dataset.code;
      list.hidden=true;
    });
  });
  document.addEventListener("click",function(e){ if(!cc.contains(e.target)) list.hidden=true; });
})();

/* ---------- Validación + envío ---------- */
const form=document.getElementById("orderForm");
function setInvalid(id,bad){ document.getElementById(id).closest(".field").classList.toggle("invalid",bad); }

/* ---------- Captura de PEDIDOS ABANDONADOS ----------
   Apenas hay un teléfono válido, guardamos lo que el cliente lleva lleno
   (en la hoja "Pedidos Abandonados") para poder escribirle si no completa. */
const ORDER_SID = "AB" + Date.now() + Math.floor(Math.random()*1e6);
// Si el cliente escribe su número CON el código de país (ej: +56 9...), se lo quitamos para no duplicarlo
function telLimpio(){
  var cc=(form.codpais.value||"").replace(/\D/g,"");
  var d=(form.telefono.value||"").replace(/\D/g,"");
  if(cc && d.indexOf(cc)===0 && d.length-cc.length>=8) d=d.slice(cc.length);
  return d;
}
function sendSheet(payload){
  if(typeof SHEET_URL==="undefined" || !SHEET_URL) return;
  try{ fetch(SHEET_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)}).catch(function(){}); }catch(e){}
}
function postAbandono(payload){
  try{ fetch("https://n8n-production-8a42.up.railway.app/webhook/abandonado",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(function(){}); }catch(e){}
}
function currentFormData(){
  return {
    sid:ORDER_SID, producto:PRODUCTO,
    cantidad: current?parseInt(current.dataset.qty,10):"", total: current?parseInt(current.dataset.price,10):"",
    nombre:form.nombre.value.trim(), indicativo:form.codpais.value, telefono:telLimpio(),
    correo:form.correo.value.trim(), direccion:form.direccion.value.trim(),
    referencia:form.referencia.value.trim(), region:form.region.value, comuna:form.comuna.value,
    pagina:location.href, fecha:new Date().toLocaleString("es-CL")
  };
}
let abandonedSent=false, abTimer, leadTracked=false;
function captureAbandoned(){
  if(form.telefono.value.replace(/\D/g,"").length < 8) return;   // solo con teléfono válido
  abandonedSent=true;
  postAbandono(Object.assign(currentFormData(),{estado:"INCOMPLETO"}));
  if(!leadTracked){ leadTracked=true; fb("Lead", { content_name: PRODUCTO, value: current?parseInt(current.dataset.price,10):17000, currency: "CLP" }); }
}
["telefono","nombre","correo","direccion","referencia"].forEach(function(id){
  var el=document.getElementById(id);
  if(el) el.addEventListener("blur",function(){ clearTimeout(abTimer); abTimer=setTimeout(captureAbandoned,300); });
});
["region","comuna"].forEach(function(id){
  var el=document.getElementById(id);
  if(el) el.addEventListener("change",function(){ clearTimeout(abTimer); abTimer=setTimeout(captureAbandoned,300); });
});
// captura mientras escribe el teléfono (apenas llega a 8+ dígitos), no solo al salir del campo
form.telefono.addEventListener("input",function(){
  if(form.telefono.value.replace(/\D/g,"").length >= 8){ clearTimeout(abTimer); abTimer=setTimeout(captureAbandoned,1200); }
});
form.addEventListener("submit",async e=>{
  e.preventDefault();
  let ok=true,bad;
  const nombre=form.nombre.value.trim();
  const tel=form.telefono.value.replace(/\D/g,"");
  const dir=form.direccion.value.trim();
  bad=nombre.length<2; setInvalid("nombre",bad); if(bad)ok=false;
  var _ccd=(form.codpais.value||"").replace(/\D/g,"");
  bad = _ccd==="56" ? !/^9\d{8}$/.test(tel) : tel.length<8;   // Chile: 9 dígitos y empieza con 9
  var _tf=document.getElementById("telefono"), _te=_tf&&_tf.closest(".field").querySelector(".err");
  if(_te) _te.textContent = (_ccd==="56"&&bad) ? "Escribe los 9 dígitos de tu celular (empieza con 9). Ej: 9 1234 5678" : "Escribe un teléfono válido.";
  setInvalid("telefono",bad); if(bad)ok=false;
  bad=dir.length<4;    setInvalid("direccion",bad); if(bad)ok=false;
  bad=!form.region.value; setInvalid("region",bad); if(bad)ok=false;
  bad=!form.comuna.value; setInvalid("comuna",bad); if(bad)ok=false;
  if(!ok){ if(window.__ayudaFormWA) window.__ayudaFormWA(); var _inv=form.querySelector(".invalid"); if(_inv) _inv.scrollIntoView({behavior:"smooth",block:"center"}); return; }

  const qty=parseInt(current.dataset.qty,10);
  const total=parseInt(current.dataset.price,10);
  const data={
    sid:ORDER_SID, producto:PRODUCTO, dropi_id:DROPI_ID, cantidad:qty, total:total,
    nombre, indicativo:form.codpais.value, telefono:telLimpio(), direccion:dir,
    correo:form.correo.value.trim(), referencia:form.referencia.value.trim(), region:form.region.value, comuna:form.comuna.value,
    pagina:location.href, fecha:new Date().toLocaleString("es-CL")
  };
  const btn=document.getElementById("submitBtn");
  btn.disabled=true; btn.textContent="Enviando…";
  try{
    if(SHEET_URL){
      await fetch(SHEET_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data)});
    } else { console.warn("SHEET_URL vacío: configúralo en app.js para guardar pedidos."); }
    // Confirmación por WhatsApp (n8n) — formato que espera el flujo
    if(N8N_CONFIRM){
      var telWA = (form.codpais.value+"").replace(/\D/g,"") + telLimpio();
      fetch(N8N_CONFIRM,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        customer:{ phone: telWA, email: form.correo.value.trim() },
        shipping_address:{ first_name: nombre.split(" ")[0], address1: dir, province: form.region.value, city: form.comuna.value, address2: form.referencia.value.trim(), country_code: form.codpais.value },
        order_number: "JG-"+String(Date.now()).slice(-6),
        line_items:[{ title: PRODUCTO, quantity: qty }],
        total_price: String(total)
      })}).catch(function(){});
    }
    // marcar el pedido abandonado como COMPLETADO (misma fila por sid)
    if(abandonedSent) postAbandono(Object.assign(currentFormData(),{estado:"COMPLETADO"}));
    // Píxel de Meta: Purchase (conversión)
    fb("Purchase", { content_name: PRODUCTO, content_ids: ["drainpro"], contents: [{ id: "drainpro", quantity: qty }], value: total, currency: "CLP" });
    // Píxel de TikTok: CompletePayment (conversión)
    tt("CompletePayment", { content_id: "drainpro", content_name: PRODUCTO, content_type: "product", contents: [{ content_id: "drainpro", content_name: PRODUCTO, quantity: qty }], value: total, currency: "CLP" });
    form.style.display="none";
    document.querySelector(".packs").style.display="none";
    document.querySelector(".summary").style.display="none";
    document.getElementById("okName").textContent=nombre.split(" ")[0];
    document.getElementById("okMsg").style.display="block";
    document.getElementById("okMsg").scrollIntoView({behavior:"smooth",block:"center"});
  }catch(err){
    btn.disabled=false; btn.textContent="COMPRAR (Pagar al Recibir) 🚚";
    alert("Hubo un problema al enviar. Intenta de nuevo o escríbenos por WhatsApp.");
  }
});

/* ============================================================
   AYUDA WhatsApp si el formulario no deja avanzar + AVISO AL SALIR
   ============================================================ */
(function(){
  var WA = (document.querySelector('.wa') && document.querySelector('.wa').href) || 'https://wa.me/56920007288';
  var WAICO = '<svg viewBox="0 0 32 32" width="15" height="15" style="vertical-align:-2px;fill:currentColor" aria-hidden="true"><path d="M16 .4C7.4.4.5 7.3.5 15.9c0 2.8.7 5.4 2.1 7.8L.3 31.6l8.1-2.1c2.3 1.3 4.9 1.9 7.6 1.9 8.6 0 15.5-6.9 15.5-15.5S24.6.4 16 .4zm0 28.3c-2.4 0-4.7-.6-6.7-1.9l-.5-.3-4.8 1.3 1.3-4.7-.3-.5c-1.4-2.1-2.1-4.6-2.1-7 0-7.1 5.8-12.9 12.9-12.9S28.9 8.8 28.9 15.9 23.1 28.7 16 28.7zm7.1-9.6c-.4-.2-2.3-1.1-2.6-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.2 1.5-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3.1-1.9-1.1-1-1.9-2.3-2.1-2.7-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.7.2-.2.3-.4.4-.7.1-.3 0-.5 0-.7-.1-.2-.9-2.1-1.2-2.9-.3-.8-.6-.7-.9-.7h-.8c-.2 0-.7.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.2 2.6 4 6.3 5.6.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.2-.3-.3-.7-.5z"/></svg>';

  /* estilos inyectados */
  var st=document.createElement('style');
  st.textContent='.form-help-wa{display:none;margin-top:12px;padding:11px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;font-size:13.5px;color:#9a3412;text-align:center;line-height:1.5}.form-help-wa a{color:#16a34a;font-weight:700;text-decoration:none}'+
    '.exit-ov{position:fixed;inset:0;background:rgba(15,12,28,.62);display:grid;place-items:center;z-index:99999;padding:18px;animation:exitfade .2s ease}@keyframes exitfade{from{opacity:0}to{opacity:1}}'+
    '.exit-card{background:#fff;border-radius:22px;max-width:380px;width:100%;padding:30px 24px 26px;text-align:center;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.45)}'+
    '.exit-x{position:absolute;top:10px;right:15px;border:0;background:none;font-size:27px;cursor:pointer;color:#aaa;line-height:1}'+
    '.exit-card .em{font-size:46px;line-height:1}.exit-card h3{font-size:22px;margin:8px 0 10px;color:#10131c;font-weight:800}'+
    '.exit-card p{font-size:15px;color:#555;line-height:1.55;margin-bottom:18px}.exit-card p b{color:#10131c}'+
    '.exit-card .exit-wa{display:block;margin-top:13px;color:#16a34a;font-weight:700;text-decoration:none;font-size:14px}';
  document.head.appendChild(st);

  /* mensaje de ayuda cuando el formulario no deja avanzar */
  window.__ayudaFormWA=function(){
    var btn=document.getElementById('submitBtn'); if(!btn) return;
    var h=document.getElementById('formHelpWA');
    if(!h){ h=document.createElement('div'); h.id='formHelpWA'; h.className='form-help-wa';
      h.innerHTML='⚠️ ¿Tienes algún inconveniente con el formulario? <a href="'+WA+'" target="_blank" rel="noopener">Escríbenos por WhatsApp y te ayudamos '+WAICO+'</a>';
      btn.parentNode.insertBefore(h, btn.nextSibling); }
    h.style.display='block';
  };

  /* aviso al salir (exit-intent) — 1 vez por sesion */
  var shown=false;
  function yaCompro(){ var ok=document.getElementById('okMsg'); return ok && ok.style.display==='block'; }
  function showExit(){
    if(shown||yaCompro()) return;
    try{ if(sessionStorage.getItem('jaye_exit')) return; sessionStorage.setItem('jaye_exit','1'); }catch(e){}
    shown=true;
    var ov=document.createElement('div'); ov.className='exit-ov';
    ov.innerHTML='<div class="exit-card"><button class="exit-x" aria-label="Cerrar">×</button>'+
      '<div class="em">🎁</div><h3>¡Espera! No te vayas todavía</h3>'+
      '<p>Esta promoción con <b>envío gratis</b> es <b>solo por hoy</b>. No pagas nada ahora: <b>pagas al recibir</b> en tu casa.</p>'+
      '<button class="btn btn--cta exit-cta" style="width:100%">Quiero completar mi pedido</button>'+
      '<a class="exit-wa" href="'+WA+'" target="_blank" rel="noopener">o escríbenos por WhatsApp '+WAICO+'</a></div>';
    document.body.appendChild(ov);
    function close(){ if(ov.parentNode) ov.parentNode.removeChild(ov); }
    ov.querySelector('.exit-x').onclick=close;
    ov.addEventListener('click',function(e){ if(e.target===ov) close(); });
    ov.querySelector('.exit-cta').onclick=function(){ close(); var p=document.getElementById('pedido'); if(p) p.scrollIntoView({behavior:'smooth'}); };
  }
  /* PC: el mouse sale por arriba (hacia cerrar/cambiar pestana) */
  document.addEventListener('mouseout',function(e){ if(e.clientY<=0 && !e.relatedTarget) showExit(); });
  /* Movil: boton atras */
  try{ history.pushState(null,'',location.href); window.addEventListener('popstate',function(){ if(!shown){ showExit(); history.pushState(null,'',location.href); } }); }catch(e){}
})();

/* ============================================================
   RULETA DE PREMIOS al entrar — premio SIEMPRE Envío Gratis.
   Usa las VARIABLES DE COLOR de la propia página (cada landing
   sale con su paleta). Al ganar entra a la página al instante.
   ============================================================ */
(function(){
  try{ if(sessionStorage.getItem('jaye_ruleta')) return; }catch(e){}
  var cf=document.createElement('script'); cf.src='confetti.min.js'; cf.async=true; document.head.appendChild(cf);

  var st=document.createElement('style');
  st.textContent=
  '.jrul-ov{position:fixed;inset:0;background:rgba(8,8,12,.8);backdrop-filter:blur(5px);display:grid;place-items:center;z-index:99998;padding:16px;animation:jrf .25s ease}@keyframes jrf{from{opacity:0}to{opacity:1}}'+
  '.jrul-ov[hidden]{display:none}'+
  '.jrul-card{position:relative;width:100%;max-width:360px;background:linear-gradient(160deg,#141416,#000);border:1px solid var(--gold,#d4af37);border-radius:24px;padding:24px 20px 26px;text-align:center;color:#fff;font-family:var(--ff,sans-serif);box-shadow:0 26px 80px rgba(0,0,0,.6)}'+
  '.jrul-x{position:absolute;top:10px;right:14px;background:none;border:0;color:#9a93a8;font-size:25px;cursor:pointer;line-height:1}'+
  '.jrul-k{display:inline-block;background:rgba(255,255,255,.1);color:var(--gold,#d4af37);border:1px solid var(--gold,#d4af37);font-weight:800;font-size:11px;padding:5px 12px;border-radius:999px;letter-spacing:.04em}'+
  '.jrul-card h2{font-family:var(--ff-head,inherit);font-size:22px;font-weight:800;margin:10px 0 2px;color:#fff}'+
  '.jrul-sub{color:#c9c2d6;font-size:13.5px;margin-bottom:14px}'+
  '.jrul-wrap{position:relative;width:272px;height:272px;margin:0 auto 4px}'+
  '.jrul-ptr{position:absolute;top:-4px;left:50%;transform:translateX(-50%);z-index:5;width:0;height:0;border-left:15px solid transparent;border-right:15px solid transparent;border-top:24px solid #fff;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4))}'+
  '.jrul-wheel{width:272px;height:272px;border-radius:50%;position:relative;transition:transform 4.6s cubic-bezier(.16,.84,.3,1);border:7px solid #fff;box-shadow:0 0 0 5px rgba(255,255,255,.12),0 16px 44px rgba(0,0,0,.5);background:conic-gradient(var(--teal,#108474) 0 60deg,var(--gold,#d4af37) 60deg 120deg,var(--indigo,#1a0a5c) 120deg 180deg,var(--naranja,#ff6b00) 180deg 240deg,var(--gold-d,#b8860b) 240deg 300deg,var(--teal-d,#0c6b5d) 300deg 360deg)}'+
  '.jrul-wheel .l{position:absolute;left:50%;top:14px;width:120px;margin-left:-60px;text-align:center;transform-origin:60px 122px;font-family:var(--ff-head,sans-serif);font-weight:800;font-size:12px;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.55);white-space:nowrap;pointer-events:none}'+
  '.jrul-hub{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:50px;height:50px;border-radius:50%;background:#fff;z-index:4;display:grid;place-items:center;font-weight:800;color:var(--teal,#108474);font-size:11px;font-family:var(--ff-head,sans-serif)}'+
  '.jrul-spin{margin-top:16px;width:100%;background:linear-gradient(90deg,var(--gold,#d4af37),var(--gold-l,#f0d080));color:#241a02;border:0;border-radius:13px;padding:15px;font-family:var(--ff-head,sans-serif);font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 10px 24px rgba(0,0,0,.3)}'+
  '.jrul-spin:disabled{opacity:.5;cursor:not-allowed}'+
  '.jrul-foot{color:#8a82a3;font-size:11px;margin-top:10px}'+
  '.jrul-win{display:none}.jrul-win .em{font-size:48px}.jrul-win h2{font-size:24px;margin:4px 0;color:#fff}'+
  '.jrul-premio{font-family:var(--ff-head,sans-serif);font-weight:800;font-size:28px;color:var(--gold,#d4af37);margin:4px 0}'+
  '.jrul-win p{color:#c9c2d6;font-size:14px;margin-bottom:16px}'+
  '.jrul-cta{width:100%;background:var(--rojo-cta,linear-gradient(90deg,#3a0808,#e0110f));color:#fff;border:0;border-radius:13px;padding:15px;font-family:var(--ff-head,sans-serif);font-weight:800;font-size:16px;cursor:pointer}'+
  '.jrul-note{margin-top:10px;color:var(--gold,#d4af37);font-weight:700;font-size:12.5px}';
  document.head.appendChild(st);

  var PREM=['ENVÍO GRATIS','5% OFF','🎁 REGALO','10% OFF','ENVÍO GRATIS','15% OFF'];
  var GRATIS=[0,4];   // la rueda SIEMPRE se detiene en un segmento de Envío Gratis
  var N=PREM.length, SEG=360/N, labels='';
  for(var i=0;i<N;i++){ labels+='<div class="l" style="transform:rotate('+(i*SEG+SEG/2)+'deg)">'+PREM[i]+'</div>'; }
  var ov=document.createElement('div'); ov.className='jrul-ov'; ov.hidden=true;
  ov.innerHTML=
   '<div class="jrul-card">'+
    '<button class="jrul-x" aria-label="Cerrar">&times;</button>'+
    '<div class="jrul-intro">'+
      '<span class="jrul-k">🎁 SOLO POR HOY</span>'+
      '<h2>¡Gira y gana tu premio!</h2><div class="jrul-sub">Tienes 1 giro gratis. ¡Mucha suerte!</div>'+
      '<div class="jrul-wrap"><div class="jrul-ptr"></div><div class="jrul-wheel">'+labels+'</div><div class="jrul-hub">GIRA</div></div>'+
      '<button class="jrul-spin">🎯 GIRAR LA RULETA</button>'+
      '<div class="jrul-foot">Válido solo en tu compra de hoy · pago contra entrega</div>'+
    '</div>'+
    '<div class="jrul-win">'+
      '<div class="em">🎉</div><h2>¡Felicidades!</h2>'+
      '<div class="jrul-premio">ENVÍO GRATIS</div>'+
      '<p>¡Tu envío gratis quedó activo en tu compra de hoy!</p>'+
      '<button class="jrul-cta">¡Empezar a comprar!</button>'+
      '<div class="jrul-note">🚚 Envío gratis aplicado</div>'+
    '</div>'+
   '</div>';
  document.body.appendChild(ov);

  var wheel=ov.querySelector('.jrul-wheel'), spin=ov.querySelector('.jrul-spin');
  var girando=false, giro=0;
  function cerrar(){ ov.hidden=true; }
  function entrarPagina(){ cerrar(); try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); } }
  function fiesta(){ if(typeof confetti!=='function') return;
    confetti({particleCount:120,spread:80,origin:{y:.4}});
    var fin=Date.now()+1000;(function fr(){ confetti({particleCount:4,angle:60,spread:55,origin:{x:0}}); confetti({particleCount:4,angle:120,spread:55,origin:{x:1}}); if(Date.now()<fin) requestAnimationFrame(fr); })();
  }
  function girar(){ if(girando) return; girando=true; spin.disabled=true;
    var idx=GRATIS[Math.floor(Math.random()*GRATIS.length)], centro=idx*SEG+SEG/2, jit=(Math.random()*0.6-0.3)*SEG;
    giro+=360*6+(360-(centro+jit)); wheel.style.transform='rotate('+giro+'deg)';
    setTimeout(function(){ ov.querySelector('.jrul-intro').style.display='none'; ov.querySelector('.jrul-win').style.display='block'; fiesta(); setTimeout(entrarPagina,1500); },4700);
  }
  function _spinTap(e){
    if(e && e.target && (e.target.closest('.jrul-x') || e.target.closest('.jrul-cta'))) return; // × cierra, CTA entra
    var win=ov.querySelector('.jrul-win'); if(win && win.style.display==='block') return;        // ya ganó: no re-gira
    girar();
  }
  ov.querySelector('.jrul-x').addEventListener('click',cerrar);
  ov.querySelector('.jrul-cta').addEventListener('click',entrarPagina);
  ov.addEventListener('click',_spinTap);   // tocar CUALQUIER parte de la ruleta la hace girar (no solo el botón)
  /* la ruleta aparece sola al entrar (1 vez por sesión) */
  setTimeout(function(){ ov.hidden=false; try{ sessionStorage.setItem('jaye_ruleta','1'); }catch(e){} }, 700);
})();
