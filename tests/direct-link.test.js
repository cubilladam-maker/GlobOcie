"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const themeApi = require("../themes.js");
function launch(search, saved = {}) {
  const locationObject = { protocol: "file:", search, href: "https://cubilladam-maker.github.io/GlobOcie/" + search };
class TestElement {
  constructor() {
    this.innerHTML = "";
    this.textContent = "";
    this.hidden = false;
    this.open = false;
    this.dataset = {};
    this.listeners = {};
  }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  querySelector() { return new TestElement(); }
  setAttribute(name, value) { this[name] = String(value); }
  showModal() { this.open = true; }
  close() { this.open = false; }
  classList = { add() {} };
}

const elements = Object.fromEntries(["#app", "#info-dialog", "#dialog-content", "#confirm-dialog", "#confirm-content", "#top-progress", "#owner-hotspot", "#owner-counter"].map(selector => [selector, new TestElement()]));
const storage = new Map(Object.entries(saved));
const rootStyle = { values: {}, setProperty(name, value) { this.values[name] = value; } };
const body = new TestElement();
const localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
const windowListeners = {};
const windowObject = {
  GLOBOCIE_THEME_API: themeApi,
  GLOBOCIE_VISITOR_COUNTER: { endpoint: "", siteId: "globocie" },
  localStorage,
  prompt: () => null,
  print() {},
  addEventListener(name, callback) { (windowListeners[name] ||= []).push(callback); },
  dispatchEvent(event) { (windowListeners[event.type] || []).forEach(callback => callback(event)); },
  CustomEvent: class { constructor(type) { this.type = type; } }
};

const timers = [];
windowObject.DecompressionStream = DecompressionStream;
const context = vm.createContext({
  console,
  URLSearchParams,
  URL,
  crypto: webcrypto,
  localStorage,
  document: {
    body,
    documentElement: { style: rootStyle, lang: "pl" },
    title: "",
    querySelector: selector => elements[selector] || new TestElement(),
    querySelectorAll: () => [],
    addEventListener() {}
  },
  window: windowObject,
  location: locationObject,
  setTimeout: callback => { timers.push(callback); return timers.length; },
  clearTimeout,
  TextDecoder,
  TextEncoder,
  Blob,
  Response,
  DecompressionStream,
  atob,
  fetch
});



  const historyCalls = [];
  windowObject.history = { state: null, replaceState(state, title, relative) { historyCalls.push(relative); locationObject.href = new URL(relative, locationObject.href).href; locationObject.search = new URL(locationObject.href).search; } };
  const renders = []; let html = "";
  Object.defineProperty(elements["#app"], "innerHTML", { get() { return html; }, set(value) { html = value; renders.push(value); } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../result-code.js"), "utf8"), context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "../i18n.js"), "utf8"), context);
  for(const topic of ['polityka-pl','religia-swiatopoglad-pl','global-warming-pl','electricity-student'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../topics/'+topic+'.quiz.gz.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../app.js'),'utf8'),context);
  return { context, elements, storage, timers, renders, historyCalls, locationObject, ready: vm.runInContext('initialQuizStartup',context) };
}
(async()=>{
  for(const moduleId of ['electricity-knowledge','political-compass','religion-worldview','global-warming'])for(const lang of ['pl','en']){
    const test=launch('?quiz='+moduleId+'&lang='+lang+'&ref=campaign#question',{'globocie-difficulty':'0','globocie-language-v1':lang==='pl'?'en':'pl','globocie-module':'political-compass','globocie-game-starts-v1':'7'});
    await test.ready;
    const run=code=>vm.runInContext(code,test.context);
    assert.equal(run('state.screen'),'quiz');assert.equal(run('state.moduleId'),moduleId);
    assert.equal(run('I18N.getLanguage()'),lang);
    assert.equal(test.storage.get('globocie-game-starts-v1'),'8','A direct entry must count once');
    assert.ok(test.renders.every(html=>!html.includes('class="start-page panel"')),'No selection-screen flash');
    assert.ok(run('state.questions.length')>0);
    assert.equal(run('state.difficulty'),moduleId==='electricity-knowledge'?1:0);
    assert.match(test.elements['#top-progress'].innerHTML,lang==='pl'?/Pytanie 1/:/Question 1/);
    run('state.answers = [{questionId: state.questions[0].id, value: "test"}]');
    const before=run('JSON.stringify(state.answers)');
    run('I18N.setLanguage('+JSON.stringify(lang==='pl'?'en':'pl')+')');
    assert.equal(run('JSON.stringify(state.answers)'),before);
    run('requestHome(); state.confirmState.onNo(); state.confirmState = null;');
    assert.equal(run('state.screen'),'quiz');assert.equal(test.historyCalls.length,0,'Cancel keeps direct URL');
    run('requestHome(); state.confirmState.onYes(); state.confirmState = null;');
    assert.equal(run('state.screen'),'start');
    assert.ok(!new URL(test.locationObject.href).searchParams.has('quiz'));
    assert.equal(new URL(test.locationObject.href).searchParams.get('ref'),'campaign');
    assert.equal(new URL(test.locationObject.href).hash,'#question');
    assert.equal(test.storage.get('globocie-game-starts-v1'),'8');
  }
  for(const search of ['', '?quiz=unknown&lang=en','?quiz=__proto__','?quiz=constructor','?quiz=https%3A%2F%2Fexample.com%2Ftest','?lang=en','?quiz=electricity-knowledge%20']){
    const test=launch(search);await test.ready;
    assert.equal(vm.runInContext('state.screen',test.context),'start');
    assert.equal(test.storage.get('globocie-game-starts-v1'),undefined);
  }
  // Use the actual language storage key, obtained from i18n rather than guessing.
  const stored=launch('?lang=en');await stored.ready;
  const saved=Object.fromEntries(stored.storage);
  const remembered=launch('?quiz=electricity-knowledge&lang=xx',saved);await remembered.ready;
  assert.equal(vm.runInContext('I18N.getLanguage()',remembered.context),'en');
  const pupil=launch('?quiz=electricity-knowledge&lang=pl',{'globocie-electricity-difficulty':'0','globocie-difficulty':'9'});await pupil.ready;
  assert.equal(vm.runInContext('state.difficulty',pupil.context),0);
  assert.ok(vm.runInContext('state.questions.every(q=>q.difficulty===0)',pupil.context));
  assert.equal(pupil.storage.get('globocie-difficulty'),'9');
  console.log('Direct links: 4 topics × PL/EN, no start-screen flash, first question, default Student and remembered Pupil, single counter increment, language preservation, cancel/confirm Home, unknown topics and stored language PASS.');
})().catch(error=>{console.error(error);process.exitCode=1;});
