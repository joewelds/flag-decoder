(() => {
  "use strict";

  const WRAPPER_CLASS = "flag-emoji-tooltip";
  const MAX_TEXT_NODE_LENGTH = 20000;

  const regionNameFormatter = typeof Intl !== "undefined" && Intl.DisplayNames
    ? new Intl.DisplayNames([navigator.language || "en"], { type: "region" })
    : null;

  const NON_COUNTRY_FLAGS = new Map([
    ["🏁", "Chequered flag"],
    ["🚩", "Triangular flag"],
    ["🎌", "Crossed flags"],
    ["🏴", "Black flag"],
    ["🏳️", "White flag"],
    ["🏳️‍🌈", "Rainbow flag"],
    ["🏳️‍⚧️", "Transgender flag"],
    ["🏴‍☠️", "Pirate flag"]
  ]);

  const SUBDIVISION_FLAGS = new Map([
    ["gbeng", "England"],
    ["gbsct", "Scotland"],
    ["gbwls", "Wales"]
  ]);

  const REGIONAL_A = 0x1f1e6;
  const ASCII_A = 0x41;

  // Match:
  // - country flags: two regional indicator symbols
  // - subdivision flags: black flag + tag letters + cancel tag
  // - common non-country flag emoji sequences
  const FLAG_REGEX = /(?:[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]+\u{E007F}|🏳️‍🌈|🏳️‍⚧️|🏴‍☠️|🏳️|🏴|🏁|🚩|🎌)/gu;

  function flagEmojiToRegionCode(flag) {
    const codePoints = Array.from(flag, ch => ch.codePointAt(0));
    if (codePoints.length !== 2) return null;
    if (!codePoints.every(cp => cp >= REGIONAL_A && cp <= 0x1f1ff)) return null;
    return String.fromCharCode(...codePoints.map(cp => cp - REGIONAL_A + ASCII_A));
  }

  function subdivisionFlagName(flag) {
    if (!flag.startsWith("🏴")) return null;

    const tagLetters = [];
    for (const ch of Array.from(flag)) {
      const cp = ch.codePointAt(0);
      if (cp >= 0xe0061 && cp <= 0xe007a) {
        tagLetters.push(String.fromCharCode(cp - 0xe0061 + 0x61));
      }
    }

    if (!tagLetters.length) return null;
    return SUBDIVISION_FLAGS.get(tagLetters.join("")) || null;
  }

  function flagName(flag) {
    const subdivision = subdivisionFlagName(flag);
    if (subdivision) return subdivision;

    const regionCode = flagEmojiToRegionCode(flag);
    if (regionCode) {
      let regionName = null;
      try {
        regionName = regionNameFormatter ? regionNameFormatter.of(regionCode) : null;
      } catch (_err) {
        regionName = null;
      }
      return regionName && regionName !== regionCode ? `${regionName} (${regionCode})` : `Country flag: ${regionCode}`;
    }

    return NON_COUNTRY_FLAGS.get(flag) || null;
  }

  function shouldSkipTextNode(node) {
    if (!node.nodeValue || !FLAG_REGEX.test(node.nodeValue)) {
      FLAG_REGEX.lastIndex = 0;
      return true;
    }
    FLAG_REGEX.lastIndex = 0;

    const parent = node.parentElement;
    if (!parent) return true;

    if (node.nodeValue.length > MAX_TEXT_NODE_LENGTH) return true;

    return Boolean(parent.closest(
      "script, style, textarea, input, select, option, code, pre, kbd, samp, svg, canvas, [contenteditable='true'], ." + WRAPPER_CLASS
    ));
  }

  function wrapFlagsInTextNode(textNode) {
    if (shouldSkipTextNode(textNode)) return;

    const text = textNode.nodeValue;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let changed = false;

    FLAG_REGEX.lastIndex = 0;
    for (const match of text.matchAll(FLAG_REGEX)) {
      const emoji = match[0];
      const name = flagName(emoji);
      if (!name) continue;

      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const span = document.createElement("span");
      span.className = WRAPPER_CLASS;
      span.textContent = emoji;
      span.title = name;
      span.setAttribute("aria-label", name);
      fragment.appendChild(span);

      lastIndex = match.index + emoji.length;
      changed = true;
    }

    if (!changed) return;

    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.replaceWith(fragment);
  }

  function scan(root = document.body) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return shouldSkipTextNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    for (const node of textNodes) wrapFlagsInTextNode(node);
  }

  function observeDynamicChanges() {
    let queued = false;
    const pendingRoots = new Set();

    const flush = () => {
      queued = false;
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      for (const root of roots) scan(root.nodeType === Node.TEXT_NODE ? root.parentNode : root);
    };

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            pendingRoots.add(node.parentNode || document.body);
          } else if (node.nodeType === Node.ELEMENT_NODE && !node.closest?.("." + WRAPPER_CLASS)) {
            pendingRoots.add(node);
          }
        }
      }

      if (!queued && pendingRoots.size) {
        queued = true;
        typeof requestIdleCallback === "function" ? requestIdleCallback(flush, { timeout: 1000 }) : setTimeout(flush, 100);
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  scan();
  observeDynamicChanges();
})();
