/* 四喜家 · 交互脚本
   原则（遵循 elayadesign/redesign-existing-projects）：
   - 滚动揭示用 IntersectionObserver，不用 window scroll 监听
   - 导航"scrolled"态用顶部哨兵 + IntersectionObserver
   - 移动端菜单：汉堡→X，全屏遮罩，body.menu-open 控制
   - 表单：内联校验 + loading/success/error 状态
   - 动效增强：进度条 / 计数 / 磁吸 用 rAF 节流的被动监听，避免多次重排
*/
(function () {
  "use strict";

  /* 0. 首屏载入：触发 hero 错峰入场 */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { document.body.classList.add("loaded"); });
  });

  /* 1. 导航 scrolled 态：顶部哨兵 */
  var sentinel = document.getElementById("nav-sentinel");
  var island = document.querySelector(".nav-island");
  if (sentinel && island && "IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      island.classList.toggle("scrolled", !e[0].isIntersecting);
    }, { rootMargin: "-8px 0px 0px 0px" }).observe(sentinel);
  }

  /* 2. 滚动揭示 + 自动错峰 */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    // 同容器内相邻 .reveal 自动错峰
    var groups = {};
    reveals.forEach(function (el) {
      var p = el.parentElement;
      if (!groups[p]) groups[p] = [];
      groups[p].push(el);
    });
    Object.keys(groups).forEach(function (k) {
      groups[k].forEach(function (el, i) {
        if (i > 0) el.style.transitionDelay = (i * 90) + "ms";
      });
    });
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* 3. 移动端菜单 */
  var burger = document.querySelector(".nav-burger");
  function closeMenu() { document.body.classList.remove("menu-open"); }
  if (burger) {
    burger.addEventListener("click", function () { document.body.classList.toggle("menu-open"); });
  }
  document.querySelectorAll(".mobile-menu a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* 4. 手风琴（FAQ + 商学院通用） */
  document.querySelectorAll(".faq-q, .kb-q").forEach(function (q) {
    q.addEventListener("click", function () {
      q.parentElement.classList.toggle("open");
      var expanded = q.parentElement.classList.contains("open");
      q.setAttribute("aria-expanded", expanded ? "true" : "false");
    });
  });

  /* 5. 数字计数（进入视口时滚动到目标值） */
  var counters = document.querySelectorAll(".stat-num[data-to]");
  if ("IntersectionObserver" in window && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        co.unobserve(el);
        var to = parseFloat(el.getAttribute("data-to")) || 0;
        var dec = (el.getAttribute("data-dec") || "0") | 0;
        var dur = 1400, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          el.textContent = (to * eased).toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = to.toFixed(dec) + (el.getAttribute("data-suffix") || "");
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    counters.forEach(function (el) {
      var to = parseFloat(el.getAttribute("data-to")) || 0;
      el.textContent = to.toFixed((el.getAttribute("data-dec") || "0") | 0) + (el.getAttribute("data-suffix") || "");
    });
  }

  /* 6. 磁吸按钮（指针靠近时轻微跟随） */
  var mags = document.querySelectorAll(".btn-magnetic");
  if (window.matchMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    mags.forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* 7. 顶部滚动进度条（被动监听 + rAF 节流） */
  var bar = document.querySelector(".scroll-progress");
  if (bar) {
    var ticking = false;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
      bar.style.width = pct + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* 8. 商学院：三级目录 + 搜索 + 滚动联动 */
  var kbNav = document.getElementById("kb-nav");
  if (kbNav) {
    var side = document.getElementById("kb-side");
    var tocToggle = document.querySelector(".kb-toc-toggle");

    // 8a. L1 大类折叠
    kbNav.querySelectorAll(".kb-l1-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var l1 = btn.parentElement;
        l1.classList.toggle("open");
        btn.setAttribute("aria-expanded", l1.classList.contains("open") ? "true" : "false");
      });
    });

    function openTopic(idx) {
      var item = document.getElementById("t" + idx);
      if (item && !item.classList.contains("open")) {
        item.classList.add("open");
        var q = item.querySelector(".kb-q");
        if (q) q.setAttribute("aria-expanded", "true");
      }
    }
    function setActiveTopic(idx) {
      kbNav.querySelectorAll(".kb-l2").forEach(function (x) {
        x.classList.toggle("active", x.getAttribute("data-t") === idx);
      });
      var a = kbNav.querySelector('.kb-l2[data-t="' + idx + '"]');
      if (a) { var l1 = a.closest(".kb-l1"); if (l1) l1.classList.add("open"); }
    }
    function closeToc() {
      document.body.classList.remove("kb-toc-open");
      if (tocToggle) tocToggle.setAttribute("aria-expanded", "false");
    }

    // 8b. L2 主题：展开内容 + 滚动到锚点
    kbNav.querySelectorAll(".kb-l2").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var idx = a.getAttribute("data-t");
        openTopic(idx);
        var target = document.getElementById("t" + idx);
        if (target) {
          if (history.replaceState) history.replaceState(null, "", "#t" + idx);
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setActiveTopic(idx);
        if (document.body.classList.contains("kb-toc-open")) closeToc();
      });
    });

    // 8c. L3 小节：展开父主题 + 滚动到具体小节
    kbNav.querySelectorAll(".kb-l3").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var sid = a.getAttribute("data-s");
        var idx = sid.split("-")[0];
        openTopic(idx);
        var block = a.closest(".kb-l2-block"); if (block) block.classList.add("open");
        var target = document.getElementById("s" + sid);
        if (target) {
          if (history.replaceState) history.replaceState(null, "", "#s" + sid);
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setActiveTopic(idx);
        kbNav.querySelectorAll(".kb-l3").forEach(function (x) { x.classList.remove("active"); });
        a.classList.add("active");
        if (document.body.classList.contains("kb-toc-open")) closeToc();
      });
    });

    // 8d. 滚动联动（scroll-spy）：高亮当前主题
    var spyTargets = document.querySelectorAll(".kb-item");
    if ("IntersectionObserver" in window && spyTargets.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setActiveTopic(en.target.id.replace("t", ""));
        });
      }, { rootMargin: "-25% 0px -65% 0px", threshold: 0 });
      spyTargets.forEach(function (t) { spy.observe(t); });
    }

    // 8e. 移动端抽屉
    if (tocToggle) {
      tocToggle.addEventListener("click", function () {
        var open = document.body.classList.toggle("kb-toc-open");
        tocToggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeToc(); });

    // 8f. 搜索：同时过滤内容 + 侧栏
    var kbSearch = document.getElementById("kb-search");
    if (kbSearch) {
      kbSearch.addEventListener("input", function () {
        var q = kbSearch.value.trim().toLowerCase();
        document.querySelectorAll(".kb-item").forEach(function (item) {
          var txt = item.textContent.toLowerCase();
          item.style.display = (!q || txt.indexOf(q) !== -1) ? "" : "none";
        });
        kbNav.querySelectorAll(".kb-l2-block").forEach(function (block) {
          var l2 = block.querySelector(".kb-l2");
          var l3s = block.querySelectorAll(".kb-l3");
          var l2hit = !q || l2.textContent.toLowerCase().indexOf(q) !== -1;
          var anyL3 = false;
          l3s.forEach(function (l3) {
            var hit = !q || l3.textContent.toLowerCase().indexOf(q) !== -1;
            l3.style.display = hit ? "" : "none";
            if (hit) anyL3 = true;
          });
          block.style.display = (l2hit || anyL3) ? "" : "none";
          if (q && (l2hit || anyL3)) {
            block.classList.add("open");
            var l1 = block.closest(".kb-l1"); if (l1) l1.classList.add("open");
          }
        });
        kbNav.querySelectorAll(".kb-l1").forEach(function (l1) {
          var any = l1.querySelector('.kb-l2-block:not([style*="none"])');
          l1.style.display = any ? "" : "none";
          if (q && any) l1.classList.add("open");
        });
      });
    }

    // 8g. 进入页面时按 URL hash 定位（如分享链接 #t12 / #s12-0）
    if (location.hash) {
      var h = location.hash.slice(1);
      if (h.indexOf("t") === 0 && document.getElementById(h)) {
        var idx = h.slice(1).split("-")[0];
        openTopic(idx); setActiveTopic(idx);
        document.getElementById(h).scrollIntoView();
      } else if (h.indexOf("s") === 0 && document.getElementById(h)) {
        var idx2 = h.slice(1).split("-")[0];
        openTopic(idx2); setActiveTopic(idx2);
        var blk = kbNav.querySelector('.kb-l3[data-s="' + h.slice(1) + '"]');
        if (blk) { blk.closest(".kb-l2-block").classList.add("open"); blk.classList.add("active"); }
        document.getElementById(h).scrollIntoView();
      }
    } else {
      // 默认展开第一个大类，便于浏览
      var first = kbNav.querySelector(".kb-l1"); if (first) first.classList.add("open");
    }
  }

  /* 9. 联系表单（演示提交：无后端，模拟成功态） */
  var form = document.getElementById("consult-form");
  if (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (inp) {
        var field = inp.closest(".field");
        var valid = inp.value.trim() !== "";
        if (inp.type === "tel" || inp.pattern) {
          var re = inp.pattern ? new RegExp(inp.pattern) : /^1[3-9]\d{9}$/;
          valid = re.test(inp.value.trim());
        }
        field.classList.toggle("invalid", !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        status.textContent = "请检查标红的必填项，手机号需为 11 位。";
        status.className = "form-status bad";
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "提交中…";
      status.textContent = "";
      status.className = "form-status";
      setTimeout(function () {
        form.innerHTML = '<div class="skeleton" style="height:160px;padding:0;"></div>';
        var done = document.createElement("div");
        done.className = "form-status ok";
        done.style.cssText = "font-size:16px;padding:8px 0;";
        done.textContent = "已收到，设计师会在 1 个工作日内通过微信 18007717818 联系你。";
        form.appendChild(done);
      }, 900);
    });
  }

  /* 10. 灵感墙：筛选 + 搜索（静态卡片，JS 增强可见性） */
  var wall = document.querySelector(".media-wall");
  if (wall) {
    var cards = Array.prototype.slice.call(wall.querySelectorAll(".insp-card"));
    var pills = document.querySelectorAll(".cat-pill");
    var search = document.getElementById("insp-search");
    var resultEl = document.getElementById("insp-result");
    function applyFilter() {
      var cat = (document.querySelector(".cat-pill.active") || {}).getAttribute && document.querySelector(".cat-pill.active").getAttribute("data-cat") || "all";
      var q = search ? search.value.trim().toLowerCase() : "";
      var shown = 0;
      cards.forEach(function (c) {
        var cm = c.getAttribute("data-cat") || "";
        var ck = (c.getAttribute("data-key") || "").toLowerCase();
        var okCat = cat === "all" || cm === cat;
        var okQ = !q || ck.indexOf(q) !== -1;
        c.classList.toggle("hidden", !(okCat && okQ));
        if (okCat && okQ) shown++;
      });
      if (resultEl) resultEl.textContent = "共 " + shown + " 条灵感";
    }
    pills.forEach(function (p) {
      p.addEventListener("click", function () {
        pills.forEach(function (x) { x.classList.remove("active"); });
        p.classList.add("active");
        applyFilter();
      });
    });
    if (search) search.addEventListener("input", applyFilter);
    applyFilter();
  }

  /* 11. 灯箱（视频 / 图集），DOM 动态生成，复用 window.SXJ_POSTS */
  var POSTS = window.SXJ_POSTS || [];
  var POST_MAP = {};
  POSTS.forEach(function (p) { POST_MAP[p.id] = p; });
  if (wall && (wall.querySelector(".insp-card") || document.querySelector(".lb-trigger"))) {
    var lb = document.createElement("div");
    lb.className = "lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.innerHTML =
      '<button class="lb-close" aria-label="关闭">&times;</button>' +
      '<button class="lb-nav prev" aria-label="上一张">&#8249;</button>' +
      '<button class="lb-nav next" aria-label="下一张">&#8250;</button>' +
      '<div class="lb-inner"><div class="lb-media"></div>' +
      '<div class="lb-cap"></div><div class="lb-counter"></div></div>';
    document.body.appendChild(lb);
    var lbMedia = lb.querySelector(".lb-media");
    var lbCap = lb.querySelector(".lb-cap");
    var lbCounter = lb.querySelector(".lb-counter");
    var curId = null, curIdx = 0, curList = [];

    function stopVideo() { var v = lbMedia.querySelector("video"); if (v) { try { v.pause(); } catch (e) {} v.removeAttribute("src"); v.load && v.load(); } }

    function renderMedia(post) {
      stopVideo();
      lbMedia.innerHTML = "";
      if (post.type === "video") {
        var v = document.createElement("video");
        v.src = post.video; v.controls = true; v.autoplay = true; v.playsInline = true; v.setAttribute("playsinline", "");
        lbMedia.appendChild(v);
        try { v.play(); } catch (e) {}
      } else {
        var img = document.createElement("img");
        img.src = post.gallery[curIdx] || post.cover;
        img.alt = post.title;
        lbMedia.appendChild(img);
      }
      var tags = (post.tags || []).map(function (t) { return "<span>#" + t + "</span>"; }).join("");
      lbCap.innerHTML = '<div class="lb-cat">' + post.category + " · " + post.date + '</div>' +
        "<h3>" + post.title + "</h3>" +
        (post.caption ? "<p>" + post.caption + "</p>" : "") +
        (tags ? '<div class="lb-tags">' + tags + "</div>" : "");
      if (post.type === "image" && post.gallery.length > 1) {
        lbCounter.textContent = (curIdx + 1) + " / " + post.gallery.length;
      } else { lbCounter.textContent = ""; }
    }

    function openPost(id, list, idx) {
      var post = POST_MAP[id]; if (!post) return;
      curId = id; curList = list || [id]; curIdx = idx || 0;
      renderMedia(post);
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      lb.querySelector(".lb-close").focus();
    }
    function closeLb() { lb.classList.remove("open"); document.body.style.overflow = ""; stopVideo(); }
    function step(d) {
      if (curList.length < 2) return;
      var i = curList.indexOf(curId);
      i = (i + d + curList.length) % curList.length;
      curId = curList[i];
      var post = POST_MAP[curId]; curIdx = 0;
      renderMedia(post);
    }

    wall.addEventListener("click", function (e) {
      var card = e.target.closest(".insp-card");
      if (!card) return;
      e.preventDefault();
      var id = card.getAttribute("data-id");
      var list = wall.getAttribute("data-order") ? wall.getAttribute("data-order").split(",") : [id];
      openPost(id, list, 0);
    });
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    lb.querySelector(".prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector(".next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target === lb.querySelector(".lb-inner")) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLb();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });

    /* 从案例页/首页跳转 inspiration.html#pNN 时，自动打开对应笔记灯箱 */
    if (location.hash && location.hash.indexOf("#p") === 0) {
      var pid = location.hash.slice(1);
      if (POST_MAP[pid]) {
        var order = wall.getAttribute("data-order");
        var plist = order ? order.split(",") : [pid];
        var pidx = plist.indexOf(pid);
        openPost(pid, plist, pidx < 0 ? 0 : pidx);
      }
    }
  }

  /* 12. 内联视频：进入视口才播放，离开暂停（省资源） */
  var inlineVideos = document.querySelectorAll(".showreel video, .reel-card video");
  if ("IntersectionObserver" in window && inlineVideos.length) {
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else { try { v.pause(); } catch (e) {} }
      });
    }, { threshold: 0.25 });
    inlineVideos.forEach(function (v) {
      v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", "");
      v.setAttribute("preload", "metadata");
      vo.observe(v);
    });
  }

  /* 13. reel-card 视频：悬停预览（桌面）、点击播放 */
  document.querySelectorAll(".reel-card").forEach(function (card) {
    var v = card.querySelector("video"); if (!v) return;
    card.addEventListener("mouseenter", function () { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); });
    card.addEventListener("mouseleave", function () { try { v.pause(); } catch (e) {} });
  });
})();
