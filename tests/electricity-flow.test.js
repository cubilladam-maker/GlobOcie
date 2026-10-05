"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const themeApi = require("../themes.js");

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
const storage = new Map();
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
  location: { protocol: "file:" },
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


const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '../topics/electricity-student.json')));
vm.runInContext(fs.readFileSync(path.join(__dirname, '../i18n.js'), 'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../topics/electricity-student.quiz.gz.js'), 'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'),context);
(async()=>{
  storage.set('globocie-difficulty','9');storage.set('globocie-game-starts-v1','20');
  await vm.runInContext('startModule("electricity-knowledge")',context);
  assert.equal(vm.runInContext('state.difficulty',context),1);
  assert.equal(storage.get('globocie-difficulty'),'9','Knowledge module must preserve other topics difficulty');
  assert.equal(storage.get('globocie-game-starts-v1'),'21');
  assert.match(elements['#app'].innerHTML,/id="difficulty-live"[^>]*value="1"[^>]*disabled/);
  assert.doesNotMatch(elements['#app'].innerHTML,/Zdecydowanie się zgadzam|oś światopoglądowa/);
  vm.runInContext('requestDifficultyChange(10)',context);
  assert.equal(vm.runInContext('state.difficulty',context),1);
  for(let run=0;run<50;run++){
    vm.runInContext('beginSession(10)',context);
    assert.equal(vm.runInContext('state.questions.length',context),10);
    assert.equal(vm.runInContext('new Set(state.questions.map(q=>q.group)).size',context),10);
    assert.equal(vm.runInContext('state.difficulty',context),1);
  }
  const i18n=windowObject.GLOBOCIE_I18N;
  // Every bank item must display its own translated question, options and hint.
  for(const q of bank.questions){
    vm.runInContext('state.questions = '+JSON.stringify([q])+';state.currentIndex=0;state.screen="quiz";',context);
    for(const lang of ['pl','en']){
      i18n.setLanguage(lang);
      const text=elements['#app'].innerHTML;
      assert.ok(text.includes(q.translations[lang]?.text || q.text));
      assert.equal((text.match(/class="answer"/g)||[]).length,4);
      for(const option of q.options)assert.ok(text.includes(option.label));
      vm.runInContext('state.hintOpen=true;render();',context);
      assert.ok(elements['#app'].innerHTML.includes(q.translations[lang]?.hint || q.hint));
    }
  }
  for(const correctCount of [10,0,5]){
    vm.runInContext('beginSession();state.screen="quiz";render();',context);
    const questions=vm.runInContext('state.questions',context);
    vm.runInContext('chooseAnswer("invalid")',context);
    assert.equal(vm.runInContext('state.answers.length',context),0);
    for(let j=0;j<questions.length;j++){
      const q=questions[j], value=j<correctCount?q.correctOptionId:q.options.find(o=>o.id!==q.correctOptionId).id;
      vm.runInContext('chooseAnswer('+JSON.stringify(value)+');chooseAnswer('+JSON.stringify(value)+')',context);
      assert.equal(vm.runInContext('state.answers.length',context),j+1,'Double clicks must not add answers');
      const before=vm.runInContext('JSON.stringify(state.answers)',context);
      i18n.setLanguage(j%2?'pl':'en');
      assert.equal(vm.runInContext('JSON.stringify(state.answers)',context),before);
      while(timers.length)timers.shift()();
    }
    assert.equal(vm.runInContext('state.screen',context),'results');
    assert.equal(vm.runInContext('knowledgeScore().correct',context),correctCount);
    assert.equal(vm.runInContext('knowledgeScore().percent',context),correctCount*10);
    vm.runInContext('state.screen="profile";render();',context);
    assert.equal((elements['#app'].innerHTML.match(/data-question-id=/g)||[]).length,10);
    i18n.setLanguage('en');assert.match(elements['#app'].innerHTML,/Answers and worked solutions/);
    assert.doesNotMatch(elements['#app'].innerHTML,/Poprawna odpowiedź|Twoja odpowiedź|Moc na wale|Prąd/);
  }
  vm.runInContext('state.screen="start";render();',context);
  assert.match(elements['#app'].innerHTML,/id="start-difficulty"[^>]*value="1"[^>]*disabled/);
  vm.runInContext('activateModule("political-compass");state.screen="start";render();',context);
  assert.equal(vm.runInContext('state.difficulty',context),9);
  assert.doesNotMatch(elements['#app'].innerHTML,/id="start-difficulty"[^>]*disabled/);
  console.log('Electricity flow: compressed loading, all 30 PL/EN questions and hints, 50 balanced draws, difficulty lock and restore, double clicks, 100/0/50% scores, solutions and Home PASS.');
})().catch(error=>{console.error(error);process.exitCode=1;});
