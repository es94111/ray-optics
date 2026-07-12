/*
 * Copyright 2026 The Ray Optics Simulation authors and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Minimal vanilla-JS replacement for the two Bootstrap 3 JS components used
 * by the static (non-Vue) pages of this site -- the "dropdown" (language
 * switcher) and "collapse" (module details) components -- so those pages no
 * longer need to load Bootstrap 3's JS bundle, which has known unpatched
 * XSS advisories in its Tooltip/Popover components. This only reproduces
 * the plain class-toggling behavior; the actual look and animation still
 * come from the vendored bootstrap.min.css, which is unaffected.
 */

document.addEventListener('click', function (e) {
  var toggle = e.target.closest('[data-toggle="dropdown"]');
  if (toggle) {
    e.preventDefault();
    var container = toggle.closest('.dropup, .dropdown, .btn-group');
    if (container) {
      var wasOpen = container.classList.contains('open');
      document.querySelectorAll('.dropup.open, .dropdown.open, .btn-group.open').forEach(function (el) {
        el.classList.remove('open');
      });
      if (!wasOpen) {
        container.classList.add('open');
      }
    }
    return;
  }

  if (!e.target.closest('.dropdown-menu')) {
    document.querySelectorAll('.dropup.open, .dropdown.open, .btn-group.open').forEach(function (el) {
      el.classList.remove('open');
    });
  }
});

document.addEventListener('click', function (e) {
  var toggle = e.target.closest('[data-toggle="collapse"]');
  if (!toggle) return;
  var selector = toggle.getAttribute('data-target') || toggle.getAttribute('href');
  if (!selector) return;
  var target = document.querySelector(selector);
  if (target) {
    e.preventDefault();
    target.classList.toggle('in');
  }
});
