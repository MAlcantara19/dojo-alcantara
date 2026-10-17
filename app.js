(function(){
  var D = window.DOJO || {};
  var $ = function(id){ return document.getElementById(id); };
  var MESES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

  function parseData(s){ var p = s.split("-"); return new Date(+p[0], +p[1]-1, +p[2]); }
  function el(tag, cls, text){ var e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }
  function dataLonga(d){ return d.getDate() + " de " + ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][d.getMonth()] + " de " + d.getFullYear(); }

  $("slogan").textContent = D.slogan || "";
  $("year").textContent = new Date().getFullYear();

  /* Próximo evento + contagem */
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var futuros = (D.eventos || []).filter(function(e){ return parseData(e.data) >= hoje; })
    .sort(function(a,b){ return parseData(a.data) - parseData(b.data); });
  if (futuros.length){
    var n = futuros[0], d = parseData(n.data), dias = Math.round((d - hoje)/86400000);
    $("nextTitle").textContent = n.titulo;
    $("nextMeta").textContent = dataLonga(d) + (n.local && n.local !== "A definir" ? " · " + n.local : "");
    $("nextCount").textContent = dias === 0 ? "É hoje!" : dias === 1 ? "Falta 1 dia" : "Faltam " + dias + " dias";
    $("nextEvent").hidden = false;
  }

  /* Avisos */
  var av = $("avisosList");
  if (!(D.avisos || []).length){ av.appendChild(el("p","empty","Nenhum aviso por enquanto.")); }
  (D.avisos || []).forEach(function(a){
    var c = el("article","card");
    c.appendChild(el("h3",null,a.titulo));
    var t = el("time",null,dataLonga(parseData(a.data))); t.setAttribute("datetime", a.data); c.appendChild(t);
    c.appendChild(el("p",null,a.texto));
    av.appendChild(c);
  });

  /* Calendário */
  var ev = $("eventsList");
  if (!futuros.length){ ev.appendChild(el("li","empty","Nenhum evento marcado. Volte em breve.")); }
  futuros.forEach(function(e){
    var d = parseData(e.data), li = el("li","event");
    var box = el("div","date"); box.appendChild(el("b",null,String(d.getDate()))); box.appendChild(el("span",null,MESES[d.getMonth()]));
    var info = el("div");
    info.appendChild(el("h3",null,e.titulo));
    info.appendChild(el("p",null,[e.hora, e.local].filter(Boolean).join(" · ")));
    if (e.tipo) info.appendChild(el("span","tag",e.tipo));
    li.appendChild(box); li.appendChild(info); ev.appendChild(li);
  });

  /* Galeria */
  var g = $("galleryGrid");
  (D.galeria || []).forEach(function(f){
    var fig = el("figure","tile"); fig.style.margin = "0";
    if (f.src){ var img = el("img"); img.src = f.src; img.alt = f.legenda || ""; img.loading = "lazy"; fig.appendChild(img); }
    fig.appendChild(el("figcaption",null,f.legenda || ""));
    g.appendChild(fig);
  });

  /* Sobre */
  (D.sobre || []).forEach(function(p){ $("sobreText").appendChild(el("p",null,p)); });

  /* Rodapé */
  var fl = $("footLinks"), c = D.contato || {};
  if (c.instagram){ var a1 = el("a",null,"Instagram"); a1.href = "https://instagram.com/" + c.instagram; a1.target = "_blank"; a1.rel = "noopener"; fl.appendChild(a1); }
  if (c.whatsapp){ if (fl.firstChild) fl.appendChild(document.createTextNode("  "));
    var a2 = el("a",null,"WhatsApp"); a2.href = "https://wa.me/" + c.whatsapp; a2.target = "_blank"; a2.rel = "noopener"; fl.appendChild(a2); }

  /* Menu lateral */
  var drawer = $("drawer"), scrim = $("scrim"), menuBtn = $("menuBtn");
  function abrir(){ drawer.classList.add("open"); drawer.setAttribute("aria-hidden","false"); scrim.hidden = false; menuBtn.setAttribute("aria-expanded","true"); $("closeBtn").focus(); }
  function fechar(){ drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded","false"); menuBtn.focus(); }
  menuBtn.addEventListener("click", abrir);
  $("closeBtn").addEventListener("click", fechar);
  scrim.addEventListener("click", fechar);
  drawer.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ drawer.classList.remove("open"); drawer.setAttribute("aria-hidden","true"); scrim.hidden = true; menuBtn.setAttribute("aria-expanded","false"); }); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" && drawer.classList.contains("open")) fechar(); });

  /* Voltar ao topo */
  var top = $("toTop");
  window.addEventListener("scroll", function(){ top.hidden = window.scrollY < 600; }, { passive:true });
  top.addEventListener("click", function(){ window.scrollTo({ top:0 }); });

  /* Tema claro/escuro */
  var root = document.documentElement;
  try { var salvo = localStorage.getItem("tema"); if (salvo) root.setAttribute("data-theme", salvo); } catch(e){}
  $("themeBtn").addEventListener("click", function(){
    var atual = root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var novo = atual === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", novo);
    try { localStorage.setItem("tema", novo); } catch(e){}
  });
})();
