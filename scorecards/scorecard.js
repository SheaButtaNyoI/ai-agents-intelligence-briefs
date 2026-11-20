(function () {
  var cfg = window.SCORECARD;
  var form = document.getElementById("scorecard-form");
  var results = document.getElementById("scorecard-results");
  var error = document.getElementById("scorecard-error");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var servicesMenu = document.getElementById("services-menu");
  var servicesBtn = document.getElementById("services-btn");

  function setServicesOpen(open) {
    if (!servicesMenu) return;
    servicesMenu.classList.toggle("open", open);
    servicesBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
        setServicesOpen(false);
      }
    });
  }
  if (servicesBtn) {
    servicesBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      setServicesOpen(servicesBtn.getAttribute("aria-expanded") !== "true");
    });
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      servicesMenu.addEventListener("mouseenter", function () { setServicesOpen(true); });
      servicesMenu.addEventListener("mouseleave", function () { setServicesOpen(false); });
    }
    document.addEventListener("click", function (event) {
      if (!servicesMenu.contains(event.target)) setServicesOpen(false);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && servicesBtn.getAttribute("aria-expanded") === "true") {
        setServicesOpen(false);
        servicesBtn.focus();
      }
    });
  }

  function bandFor(score) {
    if (score >= 14) return cfg.bands.ready;
    if (score >= 7) return cfg.bands.almost;
    return cfg.bands.notyet;
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var email = document.getElementById("scorecard-email").value.trim();
    var answers = [];
    var score = 0;
    var missing = false;
    cfg.questions.forEach(function (question, index) {
      var picked = form.querySelector('input[name="q' + (index + 1) + '"]:checked');
      if (!picked) {
        missing = true;
        return;
      }
      score += Number(picked.value);
      answers.push(picked.getAttribute("data-label"));
    });
    if (!validEmail(email) || missing) {
      error.hidden = false;
      error.textContent = missing
        ? "Answer all ten questions and enter your email to see your result."
        : "Enter a valid email to see your result.";
      return;
    }
    error.hidden = true;
    var band = bandFor(score);
    results.hidden = false;
    results.dataset.email = email;
    results.dataset.score = String(score);
    results.dataset.band = band.name;
    results.dataset.answers = JSON.stringify(answers);
    document.getElementById("band-name").textContent = band.name;
    document.getElementById("band-score").textContent = score + " / 20";
    document.getElementById("band-next").textContent = band.next;
    var extra = document.getElementById("band-link");
    if (band.linkHref) {
      extra.hidden = false;
      extra.href = band.linkHref;
      extra.textContent = band.linkText;
    } else {
      extra.hidden = true;
      extra.removeAttribute("href");
    }
    var cta = document.getElementById("mailto-cta");
    cta.textContent = cfg.cta;
    cta.className = band.secondary ? "btn btn-ghost" : "btn btn-primary";
    results.scrollIntoView({ block: "start" });
  });

  function mailtoHref(lines) {
    return "mailto:aicellreport@projectcrewai.io?subject="
      + encodeURIComponent(cfg.subject)
      + "&body=" + encodeURIComponent(lines.join("\n"));
  }

  function openMailto(anchor, lines) {
    var href = mailtoHref(lines);
    anchor.href = href;
    window.location.href = href;
  }

  function setSubmitStatus(text) {
    var statusEl = document.getElementById("submit-status");
    if (!statusEl) {
      statusEl = document.createElement("p");
      statusEl.id = "submit-status";
      statusEl.setAttribute("role", "status");
      document.getElementById("mailto-cta").parentNode.appendChild(statusEl);
    }
    statusEl.textContent = text;
  }

  function payloadFromResults(answers, followupValues, lines) {
    var payload = {
      email: results.dataset.email,
      score: results.dataset.score,
      band: results.dataset.band,
      src: cfg.src,
      _subject: cfg.subject,
      answers: answers.join(", "),
      message: lines.join("\n")
    };
    cfg.questions.forEach(function (question, index) {
      payload["q" + (index + 1)] = answers[index];
    });
    cfg.followups.forEach(function (label, index) {
      payload["followup_" + (index + 1)] = followupValues[index];
    });
    return payload;
  }

  document.getElementById("mailto-cta").addEventListener("click", function (event) {
    event.preventDefault();
    if (results.hidden) return;
    if (this.getAttribute("aria-busy") === "true") return;
    var answers = JSON.parse(results.dataset.answers);
    var lines = [
      "Email: " + results.dataset.email,
      "Score: " + results.dataset.score + "/20",
      "Band: " + results.dataset.band,
      "src: " + cfg.src,
      "",
      "Answers:"
    ];
    cfg.questions.forEach(function (question, index) {
      lines.push((index + 1) + ". " + question);
      lines.push(answers[index]);
      lines.push("");
    });
    var followupValues = [];
    cfg.followups.forEach(function (label, index) {
      var field = document.getElementById("followup-" + index);
      var value = (field && field.value.trim()) || "";
      followupValues.push(value);
      lines.push(label);
      lines.push(value);
      lines.push("");
    });
    var anchor = this;
    if (!cfg.endpoint) {
      openMailto(anchor, lines);
      return;
    }
    var payload = payloadFromResults(answers, followupValues, lines);
    anchor.setAttribute("aria-busy", "true");
    fetch(cfg.endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error("submit failed");
      return res.json().catch(function () { return {}; });
    }).then(function () {
      setSubmitStatus("Sent.");
    }).catch(function () {
      openMailto(anchor, lines);
    }).then(function () {
      anchor.removeAttribute("aria-busy");
    });
  });
})();
