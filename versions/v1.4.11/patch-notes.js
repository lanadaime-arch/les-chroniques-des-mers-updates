/* Notes de version — interface temporaire, contenu séparé et sans stockage des profils. */
(() => {
  'use strict';
  const scriptURL = document.currentScript && document.currentScript.src;
  const url = new URL('patch-notes.json', scriptURL || location.href);
  let notesPromise = null;
  let layer = null, restoreFocus = null;
  const node = (tag, cls, value) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (value !== undefined) e.textContent = String(value);
    return e;
  };
  const load = () => {
    if (!notesPromise) {
      notesPromise = fetch(url, {cache:'default'}).then(r => {
        if (!r.ok) throw new Error('Impossible de charger le journal des mises à jour.');
        return r.json();
      }).then(data => {
        if (!data || data.schema !== 1 || !Array.isArray(data.entries) || !data.entries.length) {
          throw new Error('Format des notes de mise à jour invalide.');
        }
        return data.entries;
      }).catch(error => {notesPromise = null; throw error;});
    }
    return notesPromise;
  };
  function close(){
    if (!layer) return;
    layer.remove();
    layer = null;
    document.body.classList.remove('cdm-patch-open');
    if (restoreFocus && restoreFocus.isConnected) restoreFocus.focus();
    restoreFocus = null;
  }
  function renderEntry(entry, list, article, latest){
    for (const button of list.querySelectorAll('[data-patch-version]')) {
      button.setAttribute('aria-selected',String(button.dataset.patchVersion === entry.id));
    }
    article.replaceChildren();
    const top = node('div','cdm-patch-topline');
    top.appendChild(node('span','cdm-patch-version','Version '+entry.id));
    if (entry.id === latest) top.appendChild(node('span','cdm-patch-latest','Dernière version'));
    article.appendChild(top);
    article.appendChild(node('p','cdm-patch-date',entry.date || 'Date non renseignée'));
    article.appendChild(node('h3','cdm-patch-title',entry.title || 'Mise à jour'));
    article.appendChild(node('p','cdm-patch-summary',entry.summary || ''));
    for (const part of Array.isArray(entry.sections) ? entry.sections : []) {
      if (!part || !Array.isArray(part.items) || !part.items.length) continue;
      const section = node('section','cdm-patch-section');
      section.appendChild(node('h4','',part.label || 'Détails'));
      const ul = node('ul');
      for (const item of part.items) ul.appendChild(node('li','',item));
      section.appendChild(ul);
      article.appendChild(section);
    }
    article.scrollTop = 0;
  }
  function populate(entries){
    if (!layer) return;
    const list = layer.querySelector('.cdm-patch-nav');
    const article = layer.querySelector('.cdm-patch-article');
    list.replaceChildren(node('p','cdm-patch-nav-label','Historique'));
    const latest = entries[0].id;
    for (const entry of entries) {
      const button = node('button','');
      button.type = 'button'; button.dataset.patchVersion = entry.id;
      button.setAttribute('aria-selected','false');
      button.appendChild(node('strong','', 'V'+entry.id));
      button.appendChild(node('small','',entry.date || ''));
      button.addEventListener('click',() => renderEntry(entry,list,article,latest));
      list.appendChild(button);
    }
    renderEntry(entries[0],list,article,latest);
  }
  function open(trigger) {
    if (layer) return;
    restoreFocus = trigger;
    layer = node('div','cdm-patch-layer');
    layer.innerHTML = '<button type="button" class="cdm-patch-backdrop" aria-label="Fermer les notes"></button><section class="cdm-patch-dialog" role="dialog" aria-modal="true" aria-labelledby="cdm-patch-heading"><header class="cdm-patch-head"><div><p class="cdm-patch-kicker">Les Chroniques des Mers</p><h2 id="cdm-patch-heading">Notes de mise à jour</h2></div><button type="button" class="cdm-patch-close" aria-label="Fermer">×</button></header><div class="cdm-patch-body"><nav class="cdm-patch-nav" aria-label="Historique des versions"></nav><article class="cdm-patch-article" tabindex="0"><p class="cdm-patch-status">Chargement des nouveautés…</p></article></div></section>';
    layer.querySelector('.cdm-patch-close').addEventListener('click',close);
    layer.querySelector('.cdm-patch-backdrop').addEventListener('click',close);
    document.body.appendChild(layer);
    document.body.classList.add('cdm-patch-open');
    layer.querySelector('.cdm-patch-close').focus();
    load().then(entries => { if (layer) populate(entries); }).catch(error => {
      if (!layer) return;
      layer.querySelector('.cdm-patch-article').replaceChildren(node('p','cdm-patch-status',error.message));
    });
  }
  document.addEventListener('click', e => {
    const trigger = e.target.closest && e.target.closest('button[data-patch-open]');
    if (trigger) open(trigger);
  });
  document.addEventListener('keydown', e => {
    if (!layer) return;
    if (e.key === 'Escape') {e.preventDefault(); e.stopPropagation();close();return;}
    if (e.key !== 'Tab') return;
    const controls = [...layer.querySelectorAll('button:not([disabled]), [tabindex="0"]')];
    if (!controls.length) return;
    const first = controls[0], last = controls[controls.length-1];
    if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
    else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
  },true);
})();
