         document.addEventListener('DOMContentLoaded', function () {
            var parentPillMap = {
               'kids-birthday': 'birthday',
               'custom-request': 'birthday',
               'betty-confetti': 'birthday',
               'car-boot': 'birthday',
               'home': 'birthday',
               'hotel': 'birthday',
               'university': 'birthday',
               'workplace': 'birthday',
               'anniversary-choice': 'anniversary',
               'anniversary-home': 'anniversary',
               'anniversary-hotel': 'anniversary',
               'anniversary-car': 'anniversary',
               'occasion-choice': 'surprise',
               'hall': 'surprise',
               'valentine': 'surprise',
               'baby-shower': 'surprise',
               'proposal': 'surprise',
               'christmas': 'festival',
               'new-year': 'festival',
               'easter': 'festival'
            };
            var quickLinkConfig = {
               all: {
                  title: 'All Quick Links',
                  links: [
                     { label: 'Birthday Custom Request', href: '/booking/' },
                     { label: 'Kids Birthday', filter: 'kids-birthday' },
                     { label: 'Betty And Confetti', filter: 'betty-confetti' },
                     { label: 'Car Boot', filter: 'car-boot' },
                     { label: 'Surprise At University', filter: 'university' },
                     { label: 'Surprise At Workplace', filter: 'workplace' },
                     { label: 'Anniversary Custom Request', href: '/booking/' },
                     { label: 'Anniversary At Home', filter: 'anniversary-home' },
                     { label: 'Anniversary Car Boot', filter: 'anniversary-car' },
                     { label: 'Occasion Custom Request', href: '/booking/' },
                     { label: 'Valentine\'s Day', filter: 'valentine' },
                     { label: 'Baby Shower', filter: 'baby-shower' },
                     { label: 'Proposal', filter: 'proposal' },
                     { label: 'Christmas', filter: 'christmas' },
                     { label: 'New Year', filter: 'new-year' },
                     { label: 'Easter', filter: 'easter' }
                  ]
               },
                birthday: {
                   title: 'Birthday Quick Links',
                   links: [
                      { label: 'Custom Request', href: '/booking/' },
                      { label: 'Kids Birthday', filter: 'kids-birthday' },
                      { label: 'Betty And Confetti', filter: 'betty-confetti' },
                      { label: 'Car Boot', filter: 'car-boot' },
                      { label: 'Surprise At University', filter: 'university' },
                      { label: 'Surprise At Workplace', filter: 'workplace' }
                   ]
                },
               anniversary: {
                  title: 'Anniversary Quick Links',
                  links: [
                     { label: 'Custom Request', href: '/booking/' },
                     { label: 'Decoration At Home', filter: 'anniversary-home' },
                     { label: 'Car Boot Decoration', filter: 'anniversary-car' }
                  ]
               },
               surprise: {
                  title: 'Your Occasion Quick Links',
                  links: [
                     { label: 'Custom Request', href: '/booking/' },
                     { label: 'Valentine\'s Day', filter: 'valentine' },
                     { label: 'Baby Shower', filter: 'baby-shower' },
                     { label: 'Proposal', filter: 'proposal' }
                  ]
               },
               festival: {
                  title: 'Festival Quick Links',
                  links: [
                     { label: 'Christmas Decorations', filter: 'christmas' },
                     { label: 'New Year', filter: 'new-year' },
                     { label: 'Easter', filter: 'easter' }
                  ]
               }
            };
            function getUrlFilter() {
               var params = new URLSearchParams(window.location.search);
               return params.get('filter') || 'all';
            }
            function normalizeFilter(value) {
               var normalized = (value || 'all').toString().trim().toLowerCase();
               return normalized || 'all';
            }
            function getParentCategory(filter) {
               var normalized = normalizeFilter(filter);
               if (document.querySelector('.filter-pill[data-filter="' + normalized + '"]')) {
                  return normalized;
               }
               return parentPillMap[normalized] || 'all';
            }
            function renderQuickLinks(filter) {
               var container = document.querySelector('.package-subfilter-links');
               var title = document.querySelector('.package-subfilter-title');
               var wrap = document.querySelector('.package-subfilter-wrap');
               if (!container || !title || !wrap) {
                  return;
               }
               var normalized = normalizeFilter(filter);
               var parentCategory = getParentCategory(normalized);
               if (parentCategory === 'all') {
                  wrap.classList.add('d-none');
                  container.innerHTML = '';
                  return;
               }
               wrap.classList.remove('d-none');
               var config = quickLinkConfig[parentCategory] || quickLinkConfig.all;
               title.textContent = config.title;
               container.innerHTML = '';
               config.links.forEach(function (item) {
                  var link = document.createElement('a');
                  link.className = 'package-subfilter-link';
                  link.textContent = item.label;
                  if (item.filter) {
                     link.href = '/packages/?filter=' + encodeURIComponent(item.filter);
                     link.dataset.filter = item.filter;
                     if (item.filter === normalized) {
                        link.classList.add('active');
                     }
                  } else {
                     link.href = item.href || '#';
                     link.classList.add('is-booking');
                  }
                  container.appendChild(link);
               });
            }
            function setActiveFilter(filter) {
               var activeFilter = getParentCategory(filter);
               document.querySelectorAll('.filter-pill').forEach(function (pill) {
                  pill.classList.toggle('active', pill.dataset.filter === activeFilter);
               });
            }
            function showPackages(filter) {
               var cards = document.querySelectorAll('.package-card-item');
               var visibleCount = 0;
               var normalized = normalizeFilter(filter);
               cards.forEach(function (card) {
                  var category = normalizeFilter(card.dataset.category);
                  var audience = (card.dataset.audience || '').split(',').map(function (value) {
                     return normalizeFilter(value);
                  }).filter(Boolean);
                  var tags = (card.dataset.tags || '').split(',').map(function (value) {
                     return normalizeFilter(value);
                  }).filter(Boolean);
                  var visible = normalized === 'all' || category === normalized || audience.indexOf(normalized) !== -1 || tags.indexOf(normalized) !== -1;
                  card.style.display = visible ? 'block' : 'none';
                  if (visible) {
                     visibleCount += 1;
                  }
               });
               var noResults = document.querySelector('.no-results');
               if (noResults) {
                  noResults.classList.toggle('d-none', visibleCount > 0);
               }
            }
            function setCardDetailsState(card, expanded, immediate) {
               if (!card) {
                  return;
               }
               var toggle = card.querySelector('.details-toggle');
               var details = card.querySelector('.package-details');
               if (!toggle || !details) {
                  return;
               }

               card.classList.toggle('is-expanded', expanded);
               toggle.textContent = expanded ? 'Hide details' : 'Add on';
               toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
                details.setAttribute('aria-hidden', expanded ? 'false' : 'true');

               if (immediate) {
                  details.classList.toggle('is-open', expanded);
                  details.style.maxHeight = expanded ? 'none' : '0px';
                  return;
               }

               if (expanded) {
                  details.classList.add('is-open');
                  details.style.maxHeight = details.scrollHeight + 'px';
                  return;
               }

               if (details.style.maxHeight === 'none' || !details.style.maxHeight) {
                  details.style.maxHeight = details.scrollHeight + 'px';
               }
               window.requestAnimationFrame(function () {
                  details.classList.remove('is-open');
                  details.style.maxHeight = '0px';
               });
            }
            function initPackageDetailsToggle() {
               document.querySelectorAll('.package-card').forEach(function (card, index) {
                  var toggle = card.querySelector('.details-toggle');
                  var addToCartButton = card.querySelector('.add-cart');
                  var details = card.querySelector('.package-details');
                  var ratingScore = card.dataset.packageRating || '';
                  if (!toggle || !details) {
                     return;
                  }
                  if (!ratingScore) {
                     var fallbackRatings = ['4.9', '4.8', '5.0', '4.7', '4.9', '4.8', '4.6', '5.0'];
                     ratingScore = fallbackRatings[index % fallbackRatings.length];
                     card.dataset.packageRating = ratingScore;
                  }
                  if (addToCartButton) {
                     addToCartButton.textContent = 'Add to Cart';
                     addToCartButton.setAttribute('aria-label', 'Add to cart');
                  }
                  if (!card.querySelector('.package-rating')) {
                     var front = document.createElement('div');
                     front.className = 'package-card-front';
                     var rating = document.createElement('div');
                     rating.className = 'package-rating';
                     rating.setAttribute('aria-label', '5 star rated package');
                     rating.innerHTML =
                        '<i class="fa fa-star" aria-hidden="true"></i>' +
                        '<i class="fa fa-star" aria-hidden="true"></i>' +
                        '<i class="fa fa-star" aria-hidden="true"></i>' +
                        '<i class="fa fa-star" aria-hidden="true"></i>' +
                        '<i class="fa fa-star" aria-hidden="true"></i>' +
                        '<span>' + ratingScore + ' rating</span>';
                     card.insertBefore(front, card.querySelector('.package-summary'));
                     front.appendChild(card.querySelector('.package-card-top'));
                     front.appendChild(rating);
                     front.appendChild(card.querySelector('.package-actions'));
                  }
                  if (!details.id) {
                     details.id = 'package-details-' + (index + 1);
                  }
                  toggle.setAttribute('aria-controls', details.id);
                  setCardDetailsState(card, false, true);
                  details.addEventListener('transitionend', function (event) {
                     if (event.propertyName !== 'max-height') {
                        return;
                     }
                     if (details.classList.contains('is-open')) {
                        details.style.maxHeight = 'none';
                     }
                  });
                  toggle.addEventListener('click', function (event) {
                     event.preventDefault();
                     event.stopPropagation();
                     var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                     setCardDetailsState(card, !isExpanded, false);
                  });
                  card.addEventListener('click', function (event) {
                     if (event.target.closest('.package-actions, .package-details, .package-label')) {
                        return;
                     }
                     var isExpanded = card.classList.contains('is-expanded');
                     setCardDetailsState(card, !isExpanded, false);
                  });
                  card.querySelectorAll('.package-addon-input, .package-addon-option, .add-cart').forEach(function (element) {
                     element.addEventListener('click', function (event) {
                        event.stopPropagation();
                     });
                  });
               });
            }
            function updateUrl(filter) {
               var url = new URL(window.location);
               if (filter === 'all') {
                  url.searchParams.delete('filter');
               } else {
                  url.searchParams.set('filter', filter);
               }
               window.history.replaceState({}, '', url);
            }
            function applyFilter(filter) {
               var normalized = normalizeFilter(filter);
               setActiveFilter(normalized);
               showPackages(normalized);
               updateUrl(normalized);
               renderQuickLinks(normalized);
            }
            function formatPounds(value) {
               var amount = Number(value || 0);
               var fixed = amount.toFixed(2);
               if (fixed.slice(-3) === '.00') {
                  return '\u00A3' + fixed.slice(0, -3);
               }
               return '\u00A3' + fixed;
            }
            function parseSelectedAddons(card) {
               var inputs = card.querySelectorAll('.package-addon-input:checked');
               return Array.prototype.slice.call(inputs).map(function (input) {
                  var addonPrice = Number(input.dataset.addonPrice || 0);
                  return {
                     name: input.dataset.addonName || 'Add-on',
                     price: Number.isFinite(addonPrice) ? addonPrice : 0
                  };
               });
            }
            function getCardBasePrice(card) {
               var explicitBase = Number(card.dataset.packageBasePrice || 0);
               if (explicitBase > 0) {
                  return explicitBase;
               }
               var fromData = Number(card.dataset.packagePrice || 0);
               if (fromData > 0) {
                  return fromData;
               }
               var priceLabel = card.querySelector('.package-price');
               if (!priceLabel) {
                  return 0;
               }
               return Number((priceLabel.textContent || '').replace(/[^0-9.]/g, '')) || 0;
            }
            function updateCardPriceWithAddons(card) {
               var basePrice = getCardBasePrice(card);
               var selectedAddons = parseSelectedAddons(card);
               var addonTotal = selectedAddons.reduce(function (total, addon) {
                  return total + (Number(addon.price) || 0);
               }, 0);
               var finalPrice = basePrice + addonTotal;
               var priceTag = card.querySelector('.package-price');
               var addonTotalTag = card.querySelector('.package-addon-total');
               card.dataset.packageBasePrice = basePrice.toFixed(2);
               card.dataset.packageAddonTotal = addonTotal.toFixed(2);
               card.dataset.packageFinalPrice = finalPrice.toFixed(2);
               card.dataset.packagePrice = finalPrice.toFixed(2);
               card.dataset.packageSelectedAddons = JSON.stringify(selectedAddons);
               if (priceTag) {
                  priceTag.textContent = formatPounds(finalPrice);
               }
               if (addonTotalTag) {
                  addonTotalTag.textContent = formatPounds(addonTotal);
               }
            }
            function initPackageAddonSelection() {
               document.querySelectorAll('.package-card').forEach(function (card) {
                  var basePrice = getCardBasePrice(card);
                  card.dataset.packageBasePrice = basePrice.toFixed(2);
                  card.dataset.packageAddonTotal = '0.00';
                  card.dataset.packageSelectedAddons = '[]';
                  card.querySelectorAll('.package-addon-input').forEach(function (input) {
                     input.addEventListener('input', function () {
                        updateCardPriceWithAddons(card);
                     });
                     input.addEventListener('change', function () {
                        updateCardPriceWithAddons(card);
                     });
                  });
                  updateCardPriceWithAddons(card);
               });
            }
            function initWhyFooterTyping() {
               var target = document.querySelector('.why-panel-footer em');
               if (!target) {
                  return;
               }
               var phraseItems = [
                  { text: 'Unforgettable Memories', color: '#c76b00' },
                  { text: 'Beautiful Surprises', color: '#2f7a43' },
                  { text: 'Elegant Celebrations', color: '#1f1f1f' },
                  { text: 'Meaningful Moments', color: '#c3466f' },
                  { text: 'Premium Experiences', color: '#6f1f32' }
               ];
               var current = target.textContent.trim() || phraseItems[0].text;
               if (!phraseItems.some(function (item) { return item.text === current; })) {
                  phraseItems.unshift({ text: current, color: '#6f1f32' });
               }
               function findItemByText(text) {
                  var match = phraseItems[0];
                  for (var i = 0; i < phraseItems.length; i += 1) {
                     if (phraseItems[i].text === text) {
                        match = phraseItems[i];
                        break;
                     }
                  }
                  return match;
               }
               var phraseItem = findItemByText(current);
               var phrase = phraseItem.text;
               var charIndex = 0;
               var isDeleting = false;
               target.style.color = phraseItem.color;
               target.textContent = '';
               function pickNextPhrase() {
                  var candidates = phraseItems.filter(function (item) {
                     return item.text !== phrase;
                  });
                  return candidates[Math.floor(Math.random() * candidates.length)];
               }
               function tick() {
                  target.classList.toggle('is-deleting', isDeleting);
                  target.classList.remove('is-paused');
                  if (isDeleting) {
                     charIndex = Math.max(0, charIndex - 1);
                  } else {
                     charIndex = Math.min(phrase.length, charIndex + 1);
                  }
                  target.textContent = phrase.slice(0, charIndex);
                  var delay = isDeleting ? (34 + Math.floor(Math.random() * 28)) : (56 + Math.floor(Math.random() * 34));
                  if (!isDeleting && charIndex === phrase.length) {
                     target.classList.add('is-paused');
                     delay = 1200 + Math.floor(Math.random() * 700);
                     isDeleting = true;
                  } else if (isDeleting && charIndex === 0) {
                     phraseItem = pickNextPhrase();
                     phrase = phraseItem.text;
                     target.style.color = phraseItem.color;
                     isDeleting = false;
                     target.classList.add('is-paused');
                     delay = 220 + Math.floor(Math.random() * 180);
                  }
                  window.setTimeout(tick, delay);
               }
               window.setTimeout(tick, 120);
            }
            document.querySelectorAll('.filter-pill').forEach(function (pill) {
               pill.addEventListener('click', function () {
                  applyFilter(this.dataset.filter);
               });
            });
            var quickLinksContainer = document.querySelector('.package-subfilter-links');
            if (quickLinksContainer) {
               quickLinksContainer.addEventListener('click', function (event) {
                  var quickLink = event.target.closest('.package-subfilter-link[data-filter]');
                  if (!quickLink) {
                     return;
                  }
                  event.preventDefault();
                  applyFilter(quickLink.dataset.filter);
               });
            }
            initPackageDetailsToggle();
            initPackageAddonSelection();
            initWhyFooterTyping();
            applyFilter(normalizeFilter(getUrlFilter()));
         });
      
