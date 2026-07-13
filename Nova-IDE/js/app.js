
(function(){
'use strict';

/* ===== ICONS ===== */
const IC={
  chevR:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>',
  chevD:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  folder:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  file:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  fileCode:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 13 8 15 10 17"/><polyline points="14 13 16 15 14 17"/></svg>',
  x:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  arrowU:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
  arrowD:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
  menu:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
};

/* ===== CONFIG ===== */
const CFG={tabSize:2,fontSize:14,lineHeight:21,pad:16,lnWidth:58,mmWidth:80,maxUndo:200,autoSaveMs:4000,undoCoalesceMs:500,maxClosedTabs:15};

/* ===== KEYWORDS ===== */
const JS_KW=new Set('break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch this throw try typeof var void while with yield async await'.split(' '));
const JS_BI=new Set('true false null undefined NaN Infinity console Math Array Object String Number Boolean Date RegExp Map Set Promise JSON window document parseInt parseFloat isNaN isFinite require module exports'.split(' '));
const CSS_PROP=new Set('align-content align-items align-self animation appearance background background-attachment background-blend-mode background-clip background-color background-image background-origin background-position background-repeat background-size border border-bottom border-bottom-color border-bottom-left-radius border-bottom-right-radius border-bottom-style border-bottom-width border-collapse border-color border-image border-left border-left-color border-left-style border-left-width border-radius border-right border-right-color border-right-style border-right-width border-spacing border-style border-top border-top-color border-top-left-radius border-top-right-radius border-top-style border-top-width border-width bottom box-decoration-break box-shadow box-sizing caption-side caret-color clear clip clip-path color column-count column-fill column-gap column-rule column-rule-color column-rule-style column-rule-width column-span column-width columns content counter-increment counter-reset cursor direction display empty-cells filter flex flex-basis flex-direction flex-flow flex-grow flex-shrink flex-wrap float font font-family font-feature-settings font-kerning font-size font-size-adjust font-stretch font-style font-variant font-variant-caps font-weight gap grid grid-area grid-auto-columns grid-auto-flow grid-auto-rows grid-column grid-column-end grid-column-gap grid-column-start grid-gap grid-row grid-row-end grid-row-gap grid-row-start grid-template grid-template-areas grid-template-columns grid-template-rows height justify-content justify-items justify-self left letter-spacing line-height list-style list-style-image list-style-position list-style-type margin margin-bottom margin-left margin-right margin-top max-height max-width min-height min-width mix-blend-mode object-fit object-position opacity order outline outline-color outline-offset outline-style outline-width overflow overflow-wrap overflow-x overflow-y padding padding-bottom padding-left padding-right padding-top perspective perspective-origin place-content place-items place-self pointer-events position quotes resize right row-gap scroll-behavior tab-size table-layout text-align text-align-last text-decoration text-decoration-color text-decoration-line text-decoration-style text-indent text-justify text-overflow text-shadow text-transform top transform transform-origin transform-style transition transition-delay transition-duration transition-property transition-timing-function user-select vertical-align visibility white-space width word-break word-spacing word-wrap writing-mode z-index'.split(' '));

/* ===== STATE ===== */
const S={
  files:new Map(),rootId:null,
  openTabs:[],activeTabId:null,
  tabStates:new Map(),
  openFolders:new Set(),dirty:new Set(),
  sidebarVisible:true,outputVisible:false,
  aiOpen:false,projectName:'My Project',
  closedTabs:[]
};
let findVisible=false,findText='',findMatches=[],findIdx=-1,replaceMode=false;
let findCase=false,findWhole=false,findRegex=false;
let progChange=false,updateQueued=false,charW=null;
let sidebarResizing=false,outputResizing=false;

/* ===== DOM REFS ===== */
let $menu,$sidebar,$fileTree,$tabList,$welcome,$edWrap,$edScroll,$edInner,$hlLayer,$input,$lnNums,$minimap;
let $findBar,$findInput,$findInfo,$replaceRow,$replaceInput;
let $cmdPalette,$cpInput,$cpResults,$cpOverlay;
let $ctxMenu,$aiMsgs,$aiInput,$aiSection;
let $stCursor,$stLang,$titleCenter,$outputPanel,$outputContent;
let $toastContainer;

/* ===== UTILS ===== */
let _idC=0;
function uid(){return 'f'+(++_idC)}
function escH(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function ext(name){const i=name.lastIndexOf('.');return i>=0?name.slice(i+1).toLowerCase():''}
function langOfFile(name){const e=ext(name);if(['js','mjs','cjs','ts','tsx','jsx'].includes(e))return'javascript';if(['html','htm','svg'].includes(e))return'html';if(['css','scss','less'].includes(e))return'css';if(e==='json')return'json';return'plain'}
function langLabel(l){return{javascript:'JavaScript',html:'HTML',css:'CSS',json:'JSON',plain:'Plain Text'}[l]||'Plain Text'}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;$toastContainer.appendChild(t);setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),200)},2500)}
function copyToClipboard(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text))}
  else fallbackCopy(text);
}
function fallbackCopy(text){
  const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();try{document.execCommand('copy')}catch(e){}document.body.removeChild(ta);
}

/* ===== FILE SYSTEM ===== */
function mkFile(name,type,parent,content=''){
  const id=uid();
  const node={id,name,type,parent:parent||null,content:type==='file'?content:'',children:[]};
  S.files.set(id,node);
  if(parent){const p=S.files.get(parent);if(p&&p.type==='folder')p.children.push(id)}
  return node;
}
function defaultProject(){
  const root=mkFile(S.projectName,'folder',null);S.rootId=root.id;S.openFolders.add(root.id);
  const src=mkFile('src','folder',root.id);S.openFolders.add(src.id);
  mkFile('index.html','file',src.id,'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, Forge!</h1>\n  <p>Start editing to see changes.</p>\n  <div id="app"></div>\n  <script src="app.js"><\/script>\n</body>\n</html>');
  mkFile('style.css','file',src.id,'/* Main Styles */\nbody {\n  font-family: system-ui, sans-serif;\n  max-width: 800px;\n  margin: 2rem auto;\n  padding: 0 1rem;\n  color: #e0e0e0;\n  background: #1a1a20;\n}\n\nh1 {\n  color: #f59e0b;\n  font-size: 2.5rem;\n  margin-bottom: 0.5rem;\n}\n\np {\n  color: #9e9eb2;\n  line-height: 1.6;\n}\n\n#app {\n  margin-top: 2rem;\n  padding: 1.5rem;\n  border: 1px solid #2a2a36;\n  border-radius: 8px;\n  background: #222229;\n}\n');
  mkFile('app.js','file',src.id,'// Main Application\nfunction init() {\n  const app = document.getElementById(\'app\');\n  app.innerHTML = \'<p>App loaded successfully!</p>\';\n\n  console.log(\'Project initialized\');\n}\n\n// Counter example\nlet count = 0;\nfunction increment() {\n  count++;\n  const el = document.getElementById(\'count\');\n  if (el) el.textContent = count;\n}\n\ndocument.addEventListener(\'DOMContentLoaded\', init);\n');
  mkFile('README.md','file',root.id,'# My Project\n\nBuilt with Forge IDE — a browser-based code editor.\n\n## Files\n\n- `src/index.html` — Main HTML page\n- `src/style.css` — Stylesheet\n- `src/app.js` — Application logic\n\n## Getting Started\n\nOpen `src/index.html` in a browser to view the project.\nEdit files here in Forge IDE and press Ctrl+S to save.\n');
}
function getFilePath(id){const parts=[];let n=S.files.get(id);while(n){parts.unshift(n.name);n=n.parent?S.files.get(n.parent):null}return parts.join('/')}
function findFileByName(name,parentId){
  const p=S.files.get(parentId||S.rootId);if(!p||p.type!=='folder')return null;
  for(const cid of p.children){const c=S.files.get(cid);if(c&&c.name===name)return c}return null;
}
function deleteNode(id){
  const n=S.files.get(id);if(!n)return;
  if(n.type==='folder')for(const cid of[...n.children])deleteNode(cid);
  if(n.parent){const p=S.files.get(n.parent);if(p)p.children=p.children.filter(c=>c!==id)}
  const ti=S.openTabs.indexOf(id);if(ti>=0)S.openTabs.splice(ti,1);
  S.tabStates.delete(id);S.dirty.delete(id);
  if(S.activeTabId===id){S.activeTabId=S.openTabs[S.openTabs.length-1]||null}
  S.files.delete(id);
}

/* ===== SYNTAX HIGHLIGHTING ===== */
function highlight(code,lang){
  if(lang==='javascript'||lang==='json')return highlightJS(code,lang==='json');
  if(lang==='html')return highlightHTML(code);
  if(lang==='css')return highlightCSS(code);
  return escH(code);
}
function highlightJS(code,json){
  let r='',i=0;const kw=json?new Set(['true','false','null']):JS_KW;
  while(i<code.length){
    if(!json&&code[i]==='/'&&code[i+1]==='/'){let e=code.indexOf('\n',i);if(e<0)e=code.length;r+=`<span class="hl-cmt">${escH(code.slice(i,e))}</span>`;i=e}
    else if(!json&&code[i]==='/'&&code[i+1]==='*'){let e=code.indexOf('*/',i+2);if(e<0)e=code.length;else e+=2;r+=`<span class="hl-cmt">${escH(code.slice(i,e))}</span>`;i=e}
    else if(code[i]==='"'||code[i]==="'"||(!json&&code[i]==='`')){const q=code[i];let j=i+1;while(j<code.length&&code[j]!==q){if(code[j]==='\\')j++;j++}if(j<code.length)j++;r+=`<span class="hl-str">${escH(code.slice(i,j))}</span>`;i=j}
    else if(/\d/.test(code[i])&&(i===0||!/[\w$]/.test(code[i-1]))){let j=i;while(j<code.length&&/[\d.xXa-fA-FeEoObB_]/.test(code[j]))j++;r+=`<span class="hl-num">${escH(code.slice(i,j))}</span>`;i=j}
    else if(/[a-zA-Z_$]/.test(code[i])){let j=i;while(j<code.length&&/[a-zA-Z0-9_$]/.test(code[j]))j++;const w=code.slice(i,j);
      if(kw.has(w))r+=`<span class="hl-kw">${w}</span>`;
      else if(!json&&JS_BI.has(w))r+=`<span class="hl-bi">${w}</span>`;
      else if(!json&&j<code.length&&code[j]==='(')r+=`<span class="hl-fn">${escH(w)}</span>`;
      else r+=escH(w);i=j}
    else if(/[+\-*/%=<>!&|^~?:]/.test(code[i])){r+=`<span class="hl-op">${escH(code[i])}</span>`;i++}
    else if(code[i]==='{'||code[i]==='}'){r+=`<span class="hl-punct">${escH(code[i])}</span>`;i++}
    else{r+=escH(code[i]);i++}
  }return r;
}
function highlightHTML(code){
  let r='',i=0;
  while(i<code.length){
    if(code[i]==='<'){const j=code.indexOf('>',i);if(j<0){r+=escH(code.slice(i));break}
      const tag=code.slice(i,j+1);const m=tag.match(/^(<\/?)(\w[\w-]*)/);
      if(m){r+=`<span class="hl-punct">${escH(m[1])}</span><span class="hl-tag">${escH(m[2])}</span>`;let k=m[0].length;
        while(k<tag.length-1){if(/[\s\/>]/.test(tag[k])){r+=escH(tag[k]);k++}
          else if(/[a-zA-Z_-]/.test(tag[k])){let s=k;while(k<tag.length&&/[a-zA-Z0-9_-]/.test(tag[k]))k++;r+=`<span class="hl-attr">${escH(tag.slice(s,k))}</span>`}
          else if(tag[k]==='='){r+=`<span class="hl-op">=</span>`;k++}
          else if(tag[k]==='"'||tag[k]==="'"){const q=tag[k];let e=tag.indexOf(q,k+1);if(e<0)e=tag.length-1;r+=`<span class="hl-str">${escH(tag.slice(k,e+1))}</span>`;k=e+1}
          else{k++}}
        if(tag.endsWith('/>'))r+='<span class="hl-punct">/&gt;</span>';else if(tag.endsWith('>'))r+='<span class="hl-punct">&gt;</span>'}
      else r+=escH(tag);i=j+1}
    else if(code[i]==='&'){r+='&amp;';i++}
    else{r+=escH(code[i]);i++}
  }return r;
}
function highlightCSS(code){
  let r='',i=0;
  while(i<code.length){
    if(code[i]==='/'&&code[i+1]==='*'){let e=code.indexOf('*/',i+2);if(e<0)e=code.length;else e+=2;r+=`<span class="hl-cmt">${escH(code.slice(i,e))}</span>`;i=e}
    else if(code[i]==='"'||code[i]==="'"){const q=code[i];let j=i+1;while(j<code.length&&code[j]!==q){if(code[j]==='\\')j++;j++}if(j<code.length)j++;r+=`<span class="hl-str">${escH(code.slice(i,j))}</span>`;i=j}
    else if(code[i]==='@'){let j=i+1;while(j<code.length&&/[a-zA-Z-]/.test(code[j]))j++;r+=`<span class="hl-kw">${escH(code.slice(i,j))}</span>`;i=j}
    else if(code[i]==='#'&&/[0-9a-fA-F]/.test(code[i+1]||'')){let j=i;while(j<code.length&&/[0-9a-fA-F]/.test(code[j]))j++;r+=`<span class="hl-num">${escH(code.slice(i,j))}</span>`;i=j}
    else if(/\d/.test(code[i])){let j=i;while(j<code.length&&/[\d.%a-zA-Z]/.test(code[j]))j++;r+=`<span class="hl-num">${escH(code.slice(i,j))}</span>`;i=j}
    else if(code[i]==='.'&&/[a-zA-Z]/.test(code[i+1]||'')){let j=i+1;while(j<code.length&&/[a-zA-Z0-9_-]/.test(code[j]))j++;
      if(j>i+1)r+=`<span class="hl-sel">${escH(code.slice(i,j))}</span>`;else r+='.';i=j}
    else if(/[a-zA-Z_-]/.test(code[i])){let j=i;while(j<code.length&&/[a-zA-Z0-9_-]/.test(code[j]))j++;const w=code.slice(i,j);
      if(CSS_PROP.has(w))r+=`<span class="hl-prop">${escH(w)}</span>`;
      else if(w==='important')r+=`<span class="hl-imp">${escH(w)}</span>`;
      else r+=escH(w);i=j}
    else if(/[{}:;,>+~]/.test(code[i])){r+=`<span class="hl-punct">${escH(code[i])}</span>`;i++}
    else{r+=escH(code[i]);i++}
  }return r;
}

/* ===== CHAR WIDTH ===== */
function measureChar(){
  const s=document.createElement('span');s.className='ed-text';s.style.cssText='position:absolute;visibility:hidden;white-space:pre';s.textContent='M';document.body.appendChild(s);charW=s.getBoundingClientRect().width;document.body.removeChild(s);
}

/* ===== EDITOR ENGINE ===== */
function getTabState(id){if(!S.tabStates.has(id))S.tabStates.set(id,{undoStack:[],redoStack:[],lastContent:'',lastCursor:0,lastEditTime:0,lastEditDir:null,boundary:true});return S.tabStates.get(id)}

function activateTab(id){
  if(!S.files.has(id)||S.files.get(id).type!=='file')return;
  if(S.activeTabId&&$input){const ts=getTabState(S.activeTabId);ts.lastCursor=$input.selectionStart}
  if(!S.openTabs.includes(id))S.openTabs.push(id);
  S.activeTabId=id;
  const file=S.files.get(id);
  progChange=true;$input.value=file.content;
  const ts=getTabState(id);ts.lastContent=file.content;
  const pos=ts.lastCursor||0;$input.selectionStart=$input.selectionEnd=Math.min(pos,file.content.length);
  progChange=false;showEditor();scheduleUpdate();renderTabs();renderTree();updateStatusBar();
  $titleCenter.textContent=getFilePath(id);$input.focus();
}

function closeTab(id,skipConfirm){
  const i=S.openTabs.indexOf(id);if(i<0)return;
  if(!skipConfirm&&S.dirty.has(id)){
    const f=S.files.get(id);
    if(!window.confirm(`"${f?f.name:'File'}" has unsaved changes. Close anyway?`))return;
  }
  const ts=S.tabStates.get(id);
  S.closedTabs.push({id,cursor:ts?ts.lastCursor:0});
  if(S.closedTabs.length>CFG.maxClosedTabs)S.closedTabs.shift();
  S.openTabs.splice(i,1);S.tabStates.delete(id);S.dirty.delete(id);
  if(S.activeTabId===id){S.activeTabId=S.openTabs[Math.min(i,S.openTabs.length-1)]||null;
    if(S.activeTabId)activateTab(S.activeTabId);else showWelcome()}
  renderTabs();renderTree();
}

function closeOtherTabs(id){
  [...S.openTabs].forEach(tid=>{if(tid!==id)closeTab(tid,!S.dirty.has(tid))});
}
function closeAllTabs(){
  [...S.openTabs].forEach(tid=>closeTab(tid,!S.dirty.has(tid)));
}

function reopenClosedTab(){
  while(S.closedTabs.length){
    const last=S.closedTabs.pop();
    if(S.files.has(last.id)&&!S.openTabs.includes(last.id)){
      activateTab(last.id);
      const ts=getTabState(last.id);ts.lastCursor=Math.min(last.cursor,S.files.get(last.id).content.length);
      $input.selectionStart=$input.selectionEnd=ts.lastCursor;
      return;
    }
  }
  toast('No closed tabs to reopen');
}

function promptGoToLine(){
  if(!S.activeTabId){toast('Open a file first');return}
  const lc=$input.value.split('\n').length;
  const raw=window.prompt(`Go to line (1-${lc}):`);if(raw===null)return;
  const n=parseInt(raw,10);if(!Number.isFinite(n))return;
  const line=Math.max(1,Math.min(n,lc));
  const lines=$input.value.split('\n');let pos=0;for(let i=0;i<line-1;i++)pos+=lines[i].length+1;
  $input.focus();$input.selectionStart=$input.selectionEnd=pos;scrollToPos(pos);updateStatusBar();
}

function cycleTab(dir){
  if(!S.openTabs.length)return;
  const i=S.openTabs.indexOf(S.activeTabId);
  const next=((i<0?0:i)+dir+S.openTabs.length)%S.openTabs.length;
  activateTab(S.openTabs[next]);
}

function showWelcome(){$welcome.style.display='flex';$edWrap.classList.remove('visible');$titleCenter.textContent='Welcome';updateStatusBar()}
function showEditor(){$welcome.style.display='none';$edWrap.classList.add('visible')}

function scheduleUpdate(){if(!updateQueued){updateQueued=true;requestAnimationFrame(()=>{updateQueued=false;doEditorUpdate()})}}

function doEditorUpdate(){
  if(!S.activeTabId)return;
  const code=$input.value;const lang=langOfFile(S.files.get(S.activeTabId)?.name||'');
  $hlLayer.innerHTML=highlight(code,lang)+'\n';
  const lc=code.split('\n').length;let lnH='';const cl=cursorLine();
  for(let i=1;i<=lc;i++)lnH+=`<span class="ln${i===cl+1?' active-ln':''}">${i}</span>`;
  $lnNums.innerHTML=lnH;
  const lines=code.split('\n');const maxLen=Math.max(...lines.map(l=>l.length),1);
  $edInner.style.width=Math.max(maxLen*charW+CFG.pad*2+20,$edScroll.clientWidth)+'px';
  $edInner.style.height=Math.max(lc*CFG.lineHeight+CFG.pad*2,$edScroll.clientHeight)+'px';
  $edInner.querySelector('#currentLineHighlight').style.top=(CFG.pad+cl*CFG.lineHeight)+'px';
  renderMinimap(code,lang);
}

function cursorLine(){if(!S.activeTabId)return 0;return $input.value.substring(0,$input.selectionStart).split('\n').length-1}
function cursorCol(){if(!S.activeTabId)return 0;const p=$input.selectionStart;const l=$input.value.lastIndexOf('\n',p-1);return p-(l+1)}

function pushUndo(force){
  if(!S.activeTabId)return;const ts=getTabState(S.activeTabId);const cur=$input.value;
  if(cur===ts.lastContent)return;
  const now=Date.now();
  const diff=cur.length-ts.lastContent.length;
  const dir=diff>0?'ins':(diff<0?'del':'rep');
  const singleCharEdit=Math.abs(diff)===1;
  // Coalesce runs of typing (or backspacing) into one undo step, breaking the
  // group on pauses, direction changes, structural edits, or word/punct boundaries.
  const coalesce=!force&&singleCharEdit&&dir===ts.lastEditDir&&ts.undoStack.length>0&&
    (now-ts.lastEditTime)<CFG.undoCoalesceMs&&!ts.boundary;
  if(!coalesce){
    ts.undoStack.push({content:ts.lastContent,cursor:ts.lastCursor});
    if(ts.undoStack.length>CFG.maxUndo)ts.undoStack.shift();
  }
  ts.redoStack=[];ts.lastContent=cur;ts.lastCursor=$input.selectionStart;ts.lastEditTime=now;ts.lastEditDir=dir;
  const boundaryCh=dir==='ins'?cur[$input.selectionStart-1]:null;
  ts.boundary=dir!=='ins'||/[\s(){}\[\]"'`;,.<>=]/.test(boundaryCh||'');
}

function doUndo(){
  if(!S.activeTabId)return;const ts=getTabState(S.activeTabId);if(!ts.undoStack.length)return;
  ts.redoStack.push({content:$input.value,cursor:$input.selectionStart});const st=ts.undoStack.pop();
  progChange=true;$input.value=st.content;$input.selectionStart=$input.selectionEnd=st.cursor;progChange=false;
  ts.lastContent=st.content;ts.lastCursor=st.cursor;ts.lastEditTime=0;ts.lastEditDir=null;ts.boundary=true;
  S.files.get(S.activeTabId).content=st.content;
  if(!S.dirty.has(S.activeTabId)){S.dirty.add(S.activeTabId);renderTabs();renderTree()}
  scheduleUpdate();updateStatusBar();scrollToPos(st.cursor);
}

function doRedo(){
  if(!S.activeTabId)return;const ts=getTabState(S.activeTabId);if(!ts.redoStack.length)return;
  ts.undoStack.push({content:$input.value,cursor:$input.selectionStart});const st=ts.redoStack.pop();
  progChange=true;$input.value=st.content;$input.selectionStart=$input.selectionEnd=st.cursor;progChange=false;
  ts.lastContent=st.content;ts.lastCursor=st.cursor;ts.lastEditTime=0;ts.lastEditDir=null;ts.boundary=true;
  S.files.get(S.activeTabId).content=st.content;
  if(!S.dirty.has(S.activeTabId)){S.dirty.add(S.activeTabId);renderTabs();renderTree()}
  scheduleUpdate();updateStatusBar();scrollToPos(st.cursor);
}

function handleTabKey(e){
  e.preventDefault();const s=$input.selectionStart,en=$input.selectionEnd,val=$input.value;
  if(e.shiftKey){
    const ls=val.lastIndexOf('\n',s-1)+1;let sp=0;while(sp<CFG.tabSize&&ls+sp<val.length&&val[ls+sp]===' ')sp++;
    if(sp>0){progChange=true;$input.value=val.slice(0,ls)+val.slice(ls+sp);$input.selectionStart=$input.selectionEnd=Math.max(s-sp,ls);progChange=false;onContentChange(true)}
  }else{
    if(s!==en){
      const ls=val.lastIndexOf('\n',s-1)+1;const le=val.indexOf('\n',en-1);const endLine=le<0?val.length:le;
      const indented=val.slice(ls,endLine).split('\n').map(l=>'  '+l).join('\n');
      progChange=true;$input.value=val.slice(0,ls)+indented+val.slice(endLine);$input.selectionStart=ls;$input.selectionEnd=ls+indented.length;progChange=false;onContentChange(true);
    }else{progChange=true;$input.value=val.slice(0,s)+'  '+val.slice(en);$input.selectionStart=$input.selectionEnd=s+2;progChange=false;onContentChange(true)}
  }
}

function handleEnterKey(e){
  e.preventDefault();const s=$input.selectionStart,val=$input.value;
  const ls=val.lastIndexOf('\n',s-1)+1;const line=val.slice(ls,s);
  const indent=line.match(/^(\s*)/)[1];const lastCh=val[s-1];
  let extra='';if(lastCh==='{'||lastCh===':'||lastCh==='(')extra='  ';
  const insert='\n'+indent+extra;
  progChange=true;$input.value=val.slice(0,s)+insert+val.slice($input.selectionEnd);
  $input.selectionStart=$input.selectionEnd=s+insert.length;progChange=false;onContentChange(true);
}

/* ===== LINE-LEVEL EDITING ===== */
function lineBounds(val,pos){const ls=val.lastIndexOf('\n',pos-1)+1;let le=val.indexOf('\n',pos);if(le<0)le=val.length;return[ls,le]}

function duplicateLine(){
  const val=$input.value,s=$input.selectionStart,en=$input.selectionEnd;
  if(s!==en){
    // Duplicate the selection in place, cursor lands after the copy
    progChange=true;$input.value=val.slice(0,en)+val.slice(s,en)+val.slice(en);
    $input.selectionStart=$input.selectionEnd=en+(en-s);progChange=false;onContentChange(true);return;
  }
  const[ls,le]=lineBounds(val,s);const line=val.slice(ls,le);const col=s-ls;
  progChange=true;$input.value=val.slice(0,le)+'\n'+line+val.slice(le);
  $input.selectionStart=$input.selectionEnd=le+1+col;progChange=false;onContentChange(true);
}

function deleteLine(){
  const val=$input.value,s=$input.selectionStart;
  const[ls,le]=lineBounds(val,s);
  const hasNext=le<val.length;const start=ls,end=hasNext?le+1:le;
  progChange=true;$input.value=val.slice(0,start)+val.slice(end);
  $input.selectionStart=$input.selectionEnd=Math.min(start,$input.value.length);progChange=false;onContentChange(true);
}

function moveLine(dir){
  const val=$input.value,s=$input.selectionStart;
  const[ls,le]=lineBounds(val,s);const col=s-ls;const line=val.slice(ls,le);
  if(dir<0){
    if(ls===0)return; // already first line
    const prevStart=val.lastIndexOf('\n',ls-2)+1;const prevLine=val.slice(prevStart,ls-1);
    progChange=true;$input.value=val.slice(0,prevStart)+line+'\n'+prevLine+val.slice(le);
    $input.selectionStart=$input.selectionEnd=prevStart+col;progChange=false;onContentChange(true);
  }else{
    if(le>=val.length)return; // already last line
    const nextEnd=val.indexOf('\n',le+1);const realEnd=nextEnd<0?val.length:nextEnd;const nextLine=val.slice(le+1,realEnd);
    progChange=true;$input.value=val.slice(0,ls)+nextLine+'\n'+line+val.slice(realEnd);
    $input.selectionStart=$input.selectionEnd=ls+nextLine.length+1+col;progChange=false;onContentChange(true);
  }
  scrollToPos($input.selectionStart);
}

function toggleComment(){
  const lang=langOfFile(S.files.get(S.activeTabId)?.name||'');
  const val=$input.value,s=$input.selectionStart,en=$input.selectionEnd;
  const[ls]=lineBounds(val,s);let le=val.indexOf('\n',Math.max(en-1,s));if(le<0)le=val.length;
  const block=val.slice(ls,le);const lines=block.split('\n');
  if(lang==='html'){
    const allCommented=lines.every(l=>!l.trim()||/^\s*<!--(.*)-->\s*$/.test(l));
    const out=lines.map(l=>{
      if(!l.trim())return l;
      if(allCommented)return l.replace(/^(\s*)<!--\s?/,'$1').replace(/\s?-->\s*$/,'');
      return l.replace(/^(\s*)/,'$1<!-- ').concat(' -->');
    }).join('\n');
    progChange=true;$input.value=val.slice(0,ls)+out+val.slice(le);
    $input.selectionStart=ls;$input.selectionEnd=ls+out.length;progChange=false;onContentChange(true);return;
  }
  // CSS has no line-comment syntax, so use /* */ per line; JS/plain use //
  let finalOut;
  if(lang==='css'){
    const allCommentedCSS=lines.every(l=>!l.trim()||/^\s*\/\*.*\*\/\s*$/.test(l));
    finalOut=lines.map(l=>{
      if(!l.trim())return l;
      if(allCommentedCSS)return l.replace(/^(\s*)\/\*\s?/,'$1').replace(/\s?\*\/\s*$/,'');
      return l.replace(/^(\s*)/,'$1/* ')+' */';
    }).join('\n');
  }else{
    const allCommentedJS=lines.every(l=>!l.trim()||l.trim().startsWith('//'));
    finalOut=lines.map(l=>{
      if(!l.trim())return l;
      if(allCommentedJS)return l.replace(/^(\s*)\/\/ ?/,'$1');
      return l.replace(/^(\s*)/,'$1// ');
    }).join('\n');
  }
  progChange=true;$input.value=val.slice(0,ls)+finalOut+val.slice(le);
  $input.selectionStart=ls;$input.selectionEnd=ls+finalOut.length;progChange=false;onContentChange(true);
}

function smartHome(extend){
  const val=$input.value;const anchor=$input.selectionDirection==='backward'?$input.selectionEnd:$input.selectionStart;
  const caret=$input.selectionDirection==='backward'?$input.selectionStart:$input.selectionEnd;
  const[ls]=lineBounds(val,caret);
  const m=val.slice(ls).match(/^\s*/);const firstNonWs=ls+(m?m[0].length:0);
  const target=caret===firstNonWs?ls:firstNonWs;
  if(extend){$input.setSelectionRange(Math.min(anchor,target),Math.max(anchor,target),target<anchor?'backward':'forward')}
  else{$input.selectionStart=$input.selectionEnd=target}
  updateStatusBar();
}
function smartEnd(extend){
  const val=$input.value;const anchor=$input.selectionDirection==='backward'?$input.selectionEnd:$input.selectionStart;
  const caret=$input.selectionDirection==='backward'?$input.selectionStart:$input.selectionEnd;
  const[,le]=lineBounds(val,caret);
  if(extend){$input.setSelectionRange(Math.min(anchor,le),Math.max(anchor,le),le<anchor?'backward':'forward')}
  else{$input.selectionStart=$input.selectionEnd=le}
  updateStatusBar();
}

function onContentChange(force){
  if(!S.activeTabId||progChange)return;const file=S.files.get(S.activeTabId);if(!file)return;
  pushUndo(force);file.content=$input.value;
  if(!S.dirty.has(S.activeTabId)){S.dirty.add(S.activeTabId);renderTabs();renderTree()}
  scheduleUpdate();updateStatusBar();
}

function updateStatusBar(){
  if(S.activeTabId){$stCursor.textContent=`Ln ${cursorLine()+1}, Col ${cursorCol()+1}`;$stLang.textContent=langLabel(langOfFile(S.files.get(S.activeTabId)?.name||''))}
  else{$stCursor.textContent='Ln 1, Col 1';$stLang.textContent='Plain Text'}
}

/* ===== MINIMAP ===== */
function renderMinimap(code,lang){
  const c=$minimap,ctx=c.getContext('2d');const lines=code.split('\n');const lc=lines.length;
  c.height=Math.max(lc*2,$edScroll.clientHeight);c.width=CFG.mmWidth;ctx.clearRect(0,0,c.width,c.height);
  for(let i=0;i<lc;i++){
    const l=lines[i];const tr=l.trim();let color='rgba(160,160,180,0.35)';
    if(tr.startsWith('//')||tr.startsWith('/*')||tr.startsWith('*'))color='rgba(80,80,100,0.3)';
    else if(tr.startsWith('<'))color='rgba(245,158,11,0.3)';
    else if(/["']/.test(tr))color='rgba(132,204,22,0.3)';
    else if(/^\s*\./.test(l))color='rgba(56,189,248,0.3)';
    ctx.fillStyle=color;ctx.fillRect(4,i*2,Math.min(l.length*0.7,c.width-8),1.5);
  }
  const sh=$edScroll.scrollHeight||1;const vt=($edScroll.scrollTop/sh)*c.height;const vh2=($edScroll.clientHeight/sh)*c.height;
  ctx.fillStyle='rgba(245,158,11,0.08)';ctx.fillRect(0,vt,c.width,vh2);
  ctx.strokeStyle='rgba(245,158,11,0.25)';ctx.lineWidth=1;ctx.strokeRect(0.5,vt+0.5,c.width-1,vh2);
}

/* ===== FIND / REPLACE ===== */
function showFind(replace){findVisible=true;replaceMode=replace;$findBar.classList.add('visible');$replaceRow.classList.toggle('visible',replace);$findInput.focus();$findInput.select();if(findText)doFind()}
function hideFind(){findVisible=false;$findBar.classList.remove('visible');$input.focus()}

function buildFindRegex(text){
  if(!text)return null;
  let source=findRegex?text:text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(findWhole)source=`\\b(?:${source})\\b`;
  try{return new RegExp(source,'g'+(findCase?'':'i'))}catch(e){return null}
}

function doFind(){
  findText=$findInput.value;if(!findText){findMatches=[];findIdx=-1;$findInfo.textContent='';return}
  const re=buildFindRegex(findText);
  if(!re){findMatches=[];findIdx=-1;$findInfo.textContent='Invalid regex';return}
  const val=$input.value;findMatches=[];let m;let guard=0;
  while((m=re.exec(val))){
    findMatches.push({start:m.index,end:m.index+m[0].length});
    if(m[0].length===0)re.lastIndex++; // avoid infinite loop on zero-width matches
    if(++guard>50000)break;
  }
  if(findMatches.length){
    // Try to keep the match nearest the current cursor selected, rather than always jumping to #1
    const cur=$input.selectionStart;
    let best=0;for(let i=0;i<findMatches.length;i++){if(findMatches[i].start>=cur){best=i;break}}
    findIdx=best;selectMatch();
  }else{findIdx=-1;$findInfo.textContent='No results'}
}
function selectMatch(){if(!findMatches.length)return;findIdx=((findIdx%findMatches.length)+findMatches.length)%findMatches.length;const m=findMatches[findIdx];$input.selectionStart=m.start;$input.selectionEnd=m.end;$input.focus();scrollToPos(m.start);$findInfo.textContent=`${findIdx+1} of ${findMatches.length}`}
function scrollToPos(pos){const line=$input.value.substring(0,pos).split('\n').length-1;$edScroll.scrollTop=Math.max(0,line*CFG.lineHeight-$edScroll.clientHeight/2)}
function selectMatchPrev(){if(!findMatches.length)return;findIdx--;selectMatch()}

function doReplace(){
  if(findIdx<0||!findMatches.length)return;const m=findMatches[findIdx];
  $input.value=$input.value.slice(0,m.start)+$replaceInput.value+$input.value.slice(m.end);
  S.files.get(S.activeTabId).content=$input.value;onContentChange(true);
  // Recompute matches; try to land on the match that took this one's place, else the next one
  const re=buildFindRegex(findText);
  if(re){
    const val=$input.value;findMatches=[];let mm;let guard=0;
    while((mm=re.exec(val))){findMatches.push({start:mm.index,end:mm.index+mm[0].length});if(mm[0].length===0)re.lastIndex++;if(++guard>50000)break}
  }
  if(findMatches.length){findIdx=Math.min(findIdx,findMatches.length-1);selectMatch()}
  else{findIdx=-1;$findInfo.textContent='No results'}
}
function doReplaceAll(){
  if(!findText)return;const re=buildFindRegex(findText);if(!re){toast('Invalid regex');return}
  const val=$input.value;let count=0;
  const out=val.replace(re,()=>{count++;return $replaceInput.value});
  $input.value=out;S.files.get(S.activeTabId).content=out;onContentChange(true);doFind();
  toast(`Replaced ${count} occurrence${count===1?'':'s'}`);
}

/* ===== UI RENDERING ===== */
function renderTree(){
  let h='';function walk(id,depth){
    const n=S.files.get(id);if(!n)return;const pad=depth*16;
    if(n.type==='folder'){
      const open=S.openFolders.has(id);
      h+=`<div class="tree-item" data-id="${id}" data-type="folder" style="padding-left:${pad}px"><span class="ic">${IC[open?'chevD':'chevR']}</span><span class="ic">${IC.folder}</span><span class="lbl">${escH(n.name)}</span></div>`;
      if(open)for(const cid of n.children)walk(cid,depth+1);
    }else{
      const active=S.activeTabId===id;const isCode=['js','mjs','cjs','ts','tsx','jsx','html','htm','css','scss','json'].includes(ext(n.name));
      h+=`<div class="tree-item${active?' active':''}" data-id="${id}" data-type="file" style="padding-left:${pad}px"><span class="ic">${isCode?IC.fileCode:IC.file}</span><span class="lbl">${escH(n.name)}</span>${S.dirty.has(id)?'<span class="dirty-dot"></span>':''}</div>`;
    }
  }
  if(S.rootId)walk(S.rootId,0);$fileTree.innerHTML=h;
}

function renderTabs(){
  let h='';for(const id of S.openTabs){const f=S.files.get(id);if(!f)continue;const active=id===S.activeTabId;
    h+=`<div class="tab${active?' active':''}" data-id="${id}"><span class="tab-name">${escH(f.name)}</span>${S.dirty.has(id)?'<span class="tab-dirty"></span>':''}<span class="tab-close" data-close="${id}">${IC.x}</span></div>`}
  $tabList.innerHTML=h;
}

function toggleSidebar(){S.sidebarVisible=!S.sidebarVisible;$sidebar.classList.toggle('collapsed',!S.sidebarVisible)}

/* ===== COMMAND PALETTE ===== */
const COMMANDS=[
  {label:'New File',shortcut:'Ctrl+N',fn:()=>promptNewFile()},
  {label:'Save File',shortcut:'Ctrl+S',fn:()=>saveCurrentFile()},
  {label:'Save All',shortcut:'',fn:()=>saveAll()},
  {label:'Close Tab',shortcut:'Ctrl+W',fn:()=>{if(S.activeTabId)closeTab(S.activeTabId)}},
  {label:'Toggle Sidebar',shortcut:'Ctrl+B',fn:toggleSidebar},
  {label:'Toggle Output Panel',shortcut:'Ctrl+`',fn:toggleOutput},
  {label:'Find',shortcut:'Ctrl+F',fn:()=>showFind(false)},
  {label:'Find and Replace',shortcut:'Ctrl+H',fn:()=>showFind(true)},
  {label:'Go to Line',shortcut:'Ctrl+G',fn:promptGoToLine},
  {label:'Undo',shortcut:'Ctrl+Z',fn:doUndo},
  {label:'Redo',shortcut:'Ctrl+Shift+Z',fn:doRedo},
  {label:'Duplicate Line',shortcut:'Ctrl+D',fn:()=>{if(S.activeTabId)duplicateLine()}},
  {label:'Delete Line',shortcut:'Ctrl+Shift+K',fn:()=>{if(S.activeTabId)deleteLine()}},
  {label:'Move Line Up',shortcut:'Alt+Up',fn:()=>{if(S.activeTabId)moveLine(-1)}},
  {label:'Move Line Down',shortcut:'Alt+Down',fn:()=>{if(S.activeTabId)moveLine(1)}},
  {label:'Toggle Line Comment',shortcut:'Ctrl+/',fn:()=>{if(S.activeTabId)toggleComment()}},
  {label:'Next Tab',shortcut:'Ctrl+Tab',fn:()=>cycleTab(1)},
  {label:'Previous Tab',shortcut:'Ctrl+Shift+Tab',fn:()=>cycleTab(-1)},
  {label:'Reopen Closed Tab',shortcut:'Ctrl+Shift+T',fn:reopenClosedTab},
  {label:'Close Other Tabs',shortcut:'',fn:()=>{if(S.activeTabId)closeOtherTabs(S.activeTabId)}},
  {label:'Close All Tabs',shortcut:'',fn:closeAllTabs},
  {label:'Format Document',shortcut:'',fn:()=>toast('Format hook — connect a formatter')},
  {label:'Toggle AI Assistant',shortcut:'',fn:toggleAI},
  {label:'Clear Local Storage',shortcut:'',fn:()=>{localStorage.removeItem('forge-ide');toast('Storage cleared. Reload to start fresh.')}},
];

let cpSelected=0;
function showCmdPalette(fileMode){
  $cmdPalette.classList.add('visible');cpSelected=0;
  $cpInput.value=fileMode?'':'> ';
  $cpInput.focus();
  if(fileMode)$cpInput.setSelectionRange(0,0);else $cpInput.setSelectionRange(2,2);
  filterCP();
}
function hideCmdPalette(){$cmdPalette.classList.remove('visible');if(S.activeTabId)$input.focus()}
function filterCP(){
  const raw=$cpInput.value;const isCmd=raw.startsWith('>');const query=(isCmd?raw.slice(1):raw).trim().toLowerCase();
  let items=[];
  if(isCmd){items=COMMANDS.filter(c=>c.label.toLowerCase().includes(query)).map(c=>({label:c.label,shortcut:c.shortcut,type:'cmd',fn:c.fn}))}
  else{S.files.forEach((f,id)=>{if(f.type==='file'&&f.name.toLowerCase().includes(query))items.push({label:f.name,sub:getFilePath(id),type:'file',id,fn:()=>activateTab(id)})})}
  cpSelected=Math.min(cpSelected,Math.max(items.length-1,0));if(cpSelected<0)cpSelected=0;
  let h='';items.forEach((it,i)=>{h+=`<div class="cp-item${i===cpSelected?' selected':''}" data-idx="${i}"><span>${escH(it.label)}${it.sub?' <span style="color:var(--tx-2);font-size:11px">'+escH(it.sub)+'</span>':''}</span>${it.shortcut?'<span class="cp-shortcut">'+it.shortcut+'</span>':''}</div>`});
  $cpResults.innerHTML=h;$cpResults._items=items;
}
function cpExecute(){const items=$cpResults._items||[];if(!items[cpSelected])return;items[cpSelected].fn();hideCmdPalette()}
function scrollCPIntoView(){const sel=$cpResults.querySelector('.cp-item.selected');if(sel)sel.scrollIntoView({block:'nearest'})}

/* ===== CONTEXT MENU ===== */
function showCtx(x,y,items){
  $ctxMenu._items=items;let h='';items.forEach(it=>{
    if(it.sep)h+='<div class="ctx-sep"></div>';
    else h+=`<div class="ctx-item${it.danger?' danger':''}" data-act="${it.label}">${escH(it.label)}</div>`;
  });
  $ctxMenu.innerHTML=h;$ctxMenu.style.left=x+'px';$ctxMenu.style.top=y+'px';$ctxMenu.classList.add('visible');
  requestAnimationFrame(()=>{const r=$ctxMenu.getBoundingClientRect();if(r.right>window.innerWidth)$ctxMenu.style.left=Math.max(0,x-r.width)+'px';if(r.bottom>window.innerHeight)$ctxMenu.style.top=Math.max(0,y-r.height)+'px'});
}
function hideCtx(){$ctxMenu.classList.remove('visible')}

/* ===== AI CHAT ===== */
function toggleAI(){S.aiOpen=!S.aiOpen;$aiSection.classList.toggle('collapsed',!S.aiOpen);document.getElementById('aiChev').innerHTML=IC[S.aiOpen?'chevD':'chevR']}
function addMsg(text,isUser){const d=document.createElement('div');d.className='ai-msg '+(isUser?'user':'bot');d.textContent=text;$aiMsgs.appendChild(d);$aiMsgs.scrollTop=$aiMsgs.scrollHeight}
function processAI(text){
  const t=text.trim().toLowerCase();
  if(t==='help'||t==='?')return'Available commands:\n\u2022 create file <name> \u2014 new file\n\u2022 create file <name> with <desc> \u2014 with template\n\u2022 delete file <name> \u2014 delete\n\u2022 rename <old> to <new> \u2014 rename\n\u2022 explain \u2014 analyze current file\n\u2022 find <text> \u2014 search all files\n\u2022 list \u2014 list all files\n\u2022 clear \u2014 clear chat\n\nConnect a local LLM for full AI.';
  if(t==='clear'){$aiMsgs.innerHTML='';return null}
  if(t==='list'){let out='Files:\n';S.files.forEach(f=>{if(f.type==='file')out+='  '+getFilePath(f.id)+'\n'});return out.trim()}
  if(t.startsWith('create file')){
    const rest=text.slice('create file'.length).trim();const withIdx=rest.toLowerCase().indexOf(' with ');
    let name,desc='';if(withIdx>=0){name=rest.slice(0,withIdx).trim();desc=rest.slice(withIdx+6).trim()}else name=rest;
    if(!name)return'Please specify a file name.';
    let parentId=S.rootId;if(S.activeTabId){const pf=S.files.get(S.activeTabId)?.parent;if(pf)parentId=pf}
    if(findFileByName(name,parentId))return`File "${name}" already exists.`;
    const f=mkFile(name,'file',parentId,generateTemplate(name,desc));
    let p=parentId;while(p){S.openFolders.add(p);p=S.files.get(p)?.parent}
    renderTree();activateTab(f.id);return`Created ${getFilePath(f.id)}`;
  }
  if(t.startsWith('delete file')){
    const name=text.slice('delete file'.length).trim();let found=null;S.files.forEach((f,id)=>{if(f.type==='file'&&f.name===name)found=id});
    if(!found)return`File "${name}" not found.`;const path=getFilePath(found);deleteNode(found);renderTree();renderTabs();if(!S.activeTabId)showWelcome();return`Deleted ${path}`;
  }
  if(t.startsWith('rename')){
    const m=text.match(/rename\s+(.+?)\s+to\s+(.+)/i);if(!m)return'Usage: rename <old> to <new>';
    let found=null;S.files.forEach((f,id)=>{if(f.type==='file'&&f.name===m[1].trim())found=id});
    if(!found)return`File "${m[1].trim()}" not found.`;
    S.files.get(found).name=m[2].trim();renderTree();renderTabs();if(S.activeTabId===found)$titleCenter.textContent=getFilePath(found);return`Renamed to ${m[2].trim()}`;
  }
  if(t==='explain'){
    if(!S.activeTabId)return'No file open.';const f=S.files.get(S.activeTabId);const lines=f.content.split('\n');
    const fnM=f.content.match(/function\s+(\w+)/g)||[];const clM=f.content.match(/class\s+(\w+)/g)||[];const coM=f.content.match(/(?:const|let|var)\s+(\w+)/g)||[];
    let r=`File: ${f.name}\nLines: ${lines.length}\nLanguage: ${langLabel(langOfFile(f.name))}\n`;
    if(fnM.length)r+=`Functions: ${fnM.map(m=>m.replace(/function\s+/,'')).join(', ')}\n`;
    if(clM.length)r+=`Classes: ${clM.map(m=>m.replace(/class\s+/,'')).join(', ')}\n`;
    if(coM.length)r+=`Variables: ${coM.slice(0,10).map(m=>m.replace(/(?:const|let|var)\s+/,'')).join(', ')}${coM.length>10?' ...':''}\n`;
    return r.trim()||'Empty file.';
  }
  if(t.startsWith('find ')){
    const q=text.slice(5).trim().toLowerCase();let res=[];
    S.files.forEach(f=>{if(f.type==='file')f.content.split('\n').forEach((l,i)=>{if(l.toLowerCase().includes(q))res.push(`${f.name}:${i+1}: ${l.trim()}`)})});
    return res.length?res.slice(0,15).join('\n')+(res.length>15?'\n...and more':''):`No results for "${text.slice(5).trim()}"`;
  }
  return'Unknown command. Type "help" for available commands.\n\nTo enable full AI, connect a local LLM endpoint (e.g., Ollama) via the integration hook.';
}

function generateTemplate(name,desc){
  const e=ext(name);
  if(e==='js'||e==='mjs')return`// ${desc||name}\n\nexport function main() {\n  console.log('Hello from ${name}');\n}\n\nmain();\n`;
  if(e==='html')return`<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${name}</title>\n</head>\n<body>\n  <h1>${desc||name}</h1>\n</body>\n</html>\n`;
  if(e==='css')return`/* ${desc||name} */\n\n:root {\n  --primary: #f59e0b;\n}\n\nbody {\n  margin: 0;\n  padding: 1rem;\n}\n`;
  if(e==='json')return`{\n  "name": "${name.replace(/\.json$/,'')}",\n  "version": "1.0.0",\n  "description": "${desc||''}"\n}\n`;
  return`// ${desc||name}\n`;
}

/* ===== OUTPUT PANEL ===== */
function toggleOutput(){S.outputVisible=!S.outputVisible;$outputPanel.classList.toggle('visible',S.outputVisible)}

/* ===== PERSISTENCE ===== */
function saveCurrentFile(){if(!S.activeTabId)return;S.dirty.delete(S.activeTabId);renderTabs();renderTree();persist();toast('Saved')}
function saveAll(){S.dirty.clear();renderTabs();renderTree();persist();toast('All saved')}
function persist(){
  const data={projectName:S.projectName,files:[]};
  S.files.forEach(f=>data.files.push({id:f.id,name:f.name,type:f.type,parent:f.parent,content:f.content,children:f.children}));
  try{localStorage.setItem('forge-ide',JSON.stringify(data))}catch(e){}
}
function loadPersist(){
  try{const raw=localStorage.getItem('forge-ide');if(!raw)return false;
    const data=JSON.parse(raw);S.projectName=data.projectName||'My Project';
    data.files.forEach(f=>S.files.set(f.id,{id:f.id,name:f.name,type:f.type,parent:f.parent,content:f.content||'',children:f.children||[]}));
    S.files.forEach(f=>{if(f.type==='folder'&&!f.parent)S.rootId=f.id});return S.files.size>0;
  }catch(e){return false}
}

/* ===== INLINE INPUT (the fixed version) ===== */
// The core problem: clicking a button steals focus from a synchronously-created
// input. The blur handler fires with empty text and removes the input.
// Fix: use a double-rAF to defer focus + blur handler attachment past the
// browser's post-click focus resolution, plus preventDefault on the trigger.

function makeInlineInput(parentEl, placeholder, paddingLeft, onCommit){
  // Create the input element
  const div=document.createElement('div');
  div.style.paddingLeft=paddingLeft+'px';
  const inp=document.createElement('input');
  inp.type='text';inp.className='inline-input';inp.placeholder=placeholder;
  div.appendChild(inp);parentEl.appendChild(div);

  // Flag: the input is not "live" until after the next two animation frames.
  // This ensures the browser's post-click focus shuffle has settled.
  let live=false;

  function commit(){
    if(!live)return; // ignore premature blur
    live=false;
    const v=inp.value.trim();
    div.remove();
    onCommit(v);
  }

  // Key handlers are safe to attach immediately — they won't fire during
  // the focus race because no key events happen in that micro-window.
  inp.addEventListener('keydown',e=>{
    e.stopPropagation(); // prevent global shortcuts
    if(e.key==='Enter'){live=true;commit()}
    else if(e.key==='Escape'){live=false;div.remove()}
  });

  // Defer focus AND blur handler by two animation frames so the browser
  // finishes its click→focus sequence before we go "live".
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      inp.focus();
      inp.addEventListener('blur',commit);
      live=true;
    });
  });

  // Scroll the parent so the input is visible
  requestAnimationFrame(()=>{div.scrollIntoView({block:'nearest',behavior:'smooth'})});

  return inp;
}

function promptNewFile(){
  // Determine parent folder: active tab's folder, or root
  let parentId=S.rootId;
  if(S.activeTabId){const pf=S.files.get(S.activeTabId)?.parent;if(pf)parentId=pf}
  // Calculate indent depth for visual alignment
  let depth=0,p=parentId;while(p){depth++;p=S.files.get(p)?.parent}

  makeInlineInput($fileTree, 'filename.ext', depth*16+16, function(v){
    if(!v)return;
    if(findFileByName(v,parentId)){toast('File already exists');return}
    const f=mkFile(v,'file',parentId,generateTemplate(v,''));
    // Ensure all ancestor folders are expanded
    let pp=parentId;while(pp){S.openFolders.add(pp);pp=S.files.get(pp)?.parent}
    renderTree();activateTab(f.id);
  });
}

function promptNewFolder(parentId){
  let depth=0,p=parentId||S.rootId;while(p){depth++;p=S.files.get(p)?.parent}
  makeInlineInput($fileTree, 'folder-name', depth*16+16, function(v){
    if(!v)return;
    if(findFileByName(v,parentId||S.rootId)){toast('Folder already exists');return}
    mkFile(v,'folder',parentId||S.rootId);
    S.openFolders.add(parentId||S.rootId);
    renderTree();
  });
}

function promptRename(id){
  const node=S.files.get(id);if(!node)return;
  const treeItem=$fileTree.querySelector(`.tree-item[data-id="${id}"]`);if(!treeItem)return;
  const lbl=treeItem.querySelector('.lbl');if(!lbl)return;

  // Calculate indent from the tree item's padding
  const pl=parseInt(treeItem.style.paddingLeft)||0;

  const inp=makeInlineInput(treeItem.parentNode, node.name, pl, function(v){
    if(v&&v!==node.name){
      node.name=v;renderTabs();
      if(S.activeTabId===id)$titleCenter.textContent=getFilePath(id);
    }
    renderTree();
  });
  inp.value=node.name;
  // Select the name (without extension if possible) after focus settles
  requestAnimationFrame(()=>requestAnimationFrame(()=>{inp.focus();inp.select()}));
}

function promptNewFileIn(folderId){
  let depth=0,p=folderId;while(p){depth++;p=S.files.get(p)?.parent}
  makeInlineInput($fileTree, 'filename.ext', depth*16+16, function(v){
    if(!v)return;
    if(findFileByName(v,folderId)){toast('File already exists');return}
    const f=mkFile(v,'file',folderId,generateTemplate(v,''));
    S.openFolders.add(folderId);
    renderTree();activateTab(f.id);
  });
}

/* ===== EVENT HANDLERS ===== */
function setupEvents(){
  // Title bar
  $menu.innerHTML=IC.menu;$menu.onclick=toggleSidebar;

  // Sidebar buttons — preventDefault is critical to stop the browser from
  // moving focus to the button after the click handler runs
  document.getElementById('newFileBtn').addEventListener('mousedown',e=>e.preventDefault());
  document.getElementById('newFileBtn').addEventListener('click',e=>{e.preventDefault();promptNewFile()});

  document.getElementById('newFolderBtn').addEventListener('mousedown',e=>e.preventDefault());
  document.getElementById('newFolderBtn').addEventListener('click',e=>{e.preventDefault();promptNewFolder(S.rootId)});

  // File tree — click to open/expand
  $fileTree.addEventListener('click',e=>{
    // Ignore clicks on inline inputs
    if(e.target.closest('.inline-input'))return;
    const item=e.target.closest('.tree-item');if(!item)return;
    const id=item.dataset.id,type=item.dataset.type;
    if(type==='folder'){S.openFolders.has(id)?S.openFolders.delete(id):S.openFolders.add(id);renderTree()}
    else activateTab(id);
  });

  // File tree context menu
  $fileTree.addEventListener('contextmenu',e=>{
    if(e.target.closest('.inline-input'))return;
    e.preventDefault();
    const item=e.target.closest('.tree-item');if(!item)return;
    const id=item.dataset.id,type=item.dataset.type;const items=[];
    if(type==='folder'){
      items.push({label:'New File',fn:()=>promptNewFileIn(id)});
      items.push({label:'New Folder',fn:()=>promptNewFolder(id)});
      items.push({sep:true});
      items.push({label:'Rename',fn:()=>promptRename(id)});
      items.push({label:'Delete',danger:true,fn:()=>{deleteNode(id);renderTree();renderTabs();if(!S.activeTabId)showWelcome();toast('Deleted')}});
    }else{
      items.push({label:'Rename',fn:()=>promptRename(id)});
      items.push({sep:true});
      items.push({label:'Delete',danger:true,fn:()=>{deleteNode(id);renderTree();renderTabs();if(!S.activeTabId)showWelcome();toast('Deleted')}});
    }
    showCtx(e.clientX,e.clientY,items);
  });

  // Tab bar
  $tabList.addEventListener('click',e=>{
    const close=e.target.closest('.tab-close');
    if(close){e.stopPropagation();closeTab(close.dataset.close);return}
    const tab=e.target.closest('.tab');if(tab)activateTab(tab.dataset.id);
  });
  // Middle-click closes a tab (auxclick fires for middle button)
  $tabList.addEventListener('auxclick',e=>{
    if(e.button!==1)return;
    const tab=e.target.closest('.tab');if(!tab)return;
    e.preventDefault();closeTab(tab.dataset.id);
  });
  // Right-click tab context menu
  $tabList.addEventListener('contextmenu',e=>{
    const tab=e.target.closest('.tab');if(!tab)return;
    e.preventDefault();const id=tab.dataset.id;
    showCtx(e.clientX,e.clientY,[
      {label:'Close',fn:()=>closeTab(id)},
      {label:'Close Others',fn:()=>closeOtherTabs(id)},
      {label:'Close All',fn:()=>closeAllTabs()},
      {sep:true},
      {label:'Copy Path',fn:()=>{copyToClipboard(getFilePath(id));toast('Path copied')}},
      {sep:true},
      {label:'Reveal in Explorer',fn:()=>{activateTab(id);let p=S.files.get(id)?.parent;while(p){S.openFolders.add(p);p=S.files.get(p)?.parent}renderTree()}},
    ]);
  });

  // Editor input
  $input.addEventListener('input',onContentChange);

  // Editor keydown
  $input.addEventListener('keydown',e=>{
    const ctrl=e.ctrlKey||e.metaKey;
    if(e.key==='Tab'){handleTabKey(e);return}
    if(e.key==='Enter'&&!ctrl){handleEnterKey(e);return}

    // Duplicate line/selection: Ctrl+D
    if(ctrl&&!e.shiftKey&&(e.key==='d'||e.key==='D')){e.preventDefault();duplicateLine();return}
    // Delete line: Ctrl+Shift+K
    if(ctrl&&e.shiftKey&&(e.key==='k'||e.key==='K')){e.preventDefault();deleteLine();return}
    // Move line up/down: Alt+Up / Alt+Down
    if(e.altKey&&!ctrl&&e.key==='ArrowUp'){e.preventDefault();moveLine(-1);return}
    if(e.altKey&&!ctrl&&e.key==='ArrowDown'){e.preventDefault();moveLine(1);return}
    // Toggle line comment: Ctrl+/
    if(ctrl&&(e.key==='/'||e.key==='?')){e.preventDefault();toggleComment();return}
    // Smart Home: first non-whitespace, then column 0
    if(e.key==='Home'&&!ctrl){e.preventDefault();smartHome(e.shiftKey);return}
    if(e.key==='End'&&!ctrl){e.preventDefault();smartEnd(e.shiftKey);return}

    // Auto-close brackets / quotes
    const pairs={'[':']','(':')','{':'}',"'":"'",'"':'"','`':'`'};
    const closers=new Set(Object.values(pairs));
    if(pairs[e.key]&&!ctrl&&!e.altKey){
      const s=$input.selectionStart,en=$input.selectionEnd;const val=$input.value;
      if(s!==en){
        // Wrap selection in the pair
        e.preventDefault();progChange=true;
        $input.value=val.slice(0,s)+e.key+val.slice(s,en)+pairs[e.key]+val.slice(en);
        $input.selectionStart=s+1;$input.selectionEnd=en+1;progChange=false;onContentChange(true);return;
      }
      // Quotes: skip over an identical quote right after the cursor instead of doubling up
      if(e.key===pairs[e.key]&&val[s]===e.key){e.preventDefault();$input.selectionStart=$input.selectionEnd=s+1;return}
      // Only auto-close when followed by whitespace, a closing char, or end of line —
      // avoids wrapping the rest of an existing word/token.
      const nextCh=val[s];
      const okNext=nextCh===undefined||/[\s)\]},;]/.test(nextCh)||closers.has(nextCh);
      if(okNext){
        e.preventDefault();progChange=true;
        $input.value=val.slice(0,s)+e.key+pairs[e.key]+val.slice(en);
        $input.selectionStart=$input.selectionEnd=s+1;progChange=false;onContentChange(true);return;
      }
    }
    // Skip over closing bracket/quote if cursor is just before it
    const skip={']':'[',')':'(','}':'{'};
    if(skip[e.key]&&$input.value[$input.selectionStart]===e.key){e.preventDefault();$input.selectionStart=$input.selectionEnd=$input.selectionStart+1;return}
    // Backspace deletes an empty auto-closed pair as one unit, e.g. "(|)" -> ""
    if(e.key==='Backspace'&&!ctrl&&$input.selectionStart===$input.selectionEnd){
      const s=$input.selectionStart,val=$input.value;const before=val[s-1],after=val[s];
      if(before&&pairs[before]===after){
        e.preventDefault();progChange=true;
        $input.value=val.slice(0,s-1)+val.slice(s+1);$input.selectionStart=$input.selectionEnd=s-1;progChange=false;onContentChange(true);return;
      }
    }
  });

  // Editor cursor/scroll updates
  $input.addEventListener('keyup',updateStatusBar);
  $input.addEventListener('click',()=>{updateStatusBar();scheduleUpdate()});
  $edScroll.addEventListener('scroll',()=>{$lnNums.scrollTop=$edScroll.scrollTop;scheduleUpdate()});

  // Minimap click-to-scroll
  $minimap.addEventListener('click',e=>{
    const rect=$minimap.getBoundingClientRect();
    $edScroll.scrollTop=((e.clientY-rect.top)/$minimap.height)*$edScroll.scrollHeight;
  });

  // ===== GLOBAL KEYBOARD SHORTCUTS =====
  document.addEventListener('keydown',e=>{
    // Command palette active
    if($cmdPalette.classList.contains('visible')){
      if(e.key==='Escape'){hideCmdPalette();e.preventDefault();return}
      if(e.key==='ArrowDown'){e.preventDefault();cpSelected=Math.min(cpSelected+1,($cpResults._items||[]).length-1);filterCP();scrollCPIntoView();return}
      if(e.key==='ArrowUp'){e.preventDefault();cpSelected=Math.max(cpSelected-1,0);filterCP();scrollCPIntoView();return}
      if(e.key==='Enter'){e.preventDefault();cpExecute();return}
      return;
    }
    // Find bar active
    if(findVisible&&(document.activeElement===$findInput||document.activeElement===$replaceInput)){
      if(e.key==='Escape'){hideFind();e.preventDefault();return}
      if(e.key==='Enter'){e.preventDefault();e.shiftKey?selectMatchPrev():selectMatch();return}
      return;
    }
    // Don't capture when focus is on non-editor inputs
    const ae=document.activeElement;
    if(ae&&ae!==$input&&(ae.tagName==='INPUT'||ae.isContentEditable))return;

    const ctrl=e.ctrlKey||e.metaKey;
    if(ctrl&&e.key==='s'){e.preventDefault();saveCurrentFile();return}
    if(ctrl&&e.shiftKey&&(e.key==='Z'||e.key==='z')){e.preventDefault();doRedo();return}
    if(ctrl&&!e.shiftKey&&(e.key==='Z'||e.key==='z')){e.preventDefault();doUndo();return}
    if(ctrl&&e.key==='p'&&!e.shiftKey){e.preventDefault();showCmdPalette(true);return}
    if(ctrl&&e.shiftKey&&e.key==='P'){e.preventDefault();showCmdPalette(false);return}
    if(ctrl&&e.key==='f'){e.preventDefault();showFind(false);return}
    if(ctrl&&e.key==='h'){e.preventDefault();showFind(true);return}
    if(ctrl&&e.key==='n'){e.preventDefault();promptNewFile();return}
    if(ctrl&&e.key==='w'){e.preventDefault();if(S.activeTabId)closeTab(S.activeTabId);return}
    if(ctrl&&e.key==='b'){e.preventDefault();toggleSidebar();return}
    if(ctrl&&e.key==='g'&&!e.shiftKey){e.preventDefault();promptGoToLine();return}
    if(ctrl&&e.key==='`'){e.preventDefault();toggleOutput();return}
    if(ctrl&&e.shiftKey&&(e.key==='T'||e.key==='t')){e.preventDefault();reopenClosedTab();return}
    if(ctrl&&!e.shiftKey&&e.key==='Tab'){e.preventDefault();cycleTab(1);return}
    if(ctrl&&e.shiftKey&&e.key==='Tab'){e.preventDefault();cycleTab(-1);return}
  });

  // Command palette events
  $cpInput.addEventListener('input',()=>{cpSelected=0;filterCP()});
  $cpOverlay.addEventListener('click',hideCmdPalette);
  $cpResults.addEventListener('click',e=>{const item=e.target.closest('.cp-item');if(item){cpSelected=parseInt(item.dataset.idx);cpExecute()}});

  // Find bar events
  $findInput.addEventListener('input',()=>{findIdx=0;doFind()});
  document.getElementById('findNext').innerHTML=IC.arrowD;
  document.getElementById('findPrev').innerHTML=IC.arrowU;
  document.getElementById('findNext').onclick=selectMatch;
  document.getElementById('findPrev').onclick=selectMatchPrev;
  document.getElementById('findClose').innerHTML=IC.x;
  document.getElementById('findClose').onclick=hideFind;
  document.getElementById('replaceBtn').onclick=doReplace;
  document.getElementById('replaceAllBtn').onclick=doReplaceAll;
  document.getElementById('findCaseBtn').onclick=()=>{findCase=!findCase;document.getElementById('findCaseBtn').classList.toggle('active',findCase);doFind()};
  document.getElementById('findWordBtn').onclick=()=>{findWhole=!findWhole;document.getElementById('findWordBtn').classList.toggle('active',findWhole);doFind()};
  document.getElementById('findRegexBtn').onclick=()=>{findRegex=!findRegex;document.getElementById('findRegexBtn').classList.toggle('active',findRegex);doFind()};

  // Context menu
  document.addEventListener('click',e=>{if(!e.target.closest('#ctxMenu'))hideCtx()});
  $ctxMenu.addEventListener('click',e=>{
    const item=e.target.closest('.ctx-item');if(!item)return;
    const label=item.dataset.act;const items=$ctxMenu._items||[];
    const it=items.find(i=>i.label===label);if(it){hideCtx();it.fn()}
  });

  // AI chat
  document.getElementById('aiToggle').onclick=toggleAI;
  document.getElementById('aiSendBtn').onclick=sendAI;
  $aiInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();sendAI()}});

  // Output panel
  document.getElementById('closeOutputBtn').innerHTML=IC.x;
  document.getElementById('closeOutputBtn').onclick=toggleOutput;

  // Welcome screen
  document.getElementById('wNewFile').addEventListener('mousedown',e=>e.preventDefault());
  document.getElementById('wNewFile').addEventListener('click',e=>{e.preventDefault();promptNewFile()});
  document.getElementById('wShortcuts').addEventListener('mousedown',e=>e.preventDefault());
  document.getElementById('wShortcuts').addEventListener('click',e=>{e.preventDefault();showCmdPalette(false)});

  // Resize
  window.addEventListener('resize',()=>{if(S.activeTabId)scheduleUpdate()});

  // Sidebar drag-to-resize
  const $sbResizer=document.getElementById('sidebarResizer');
  $sbResizer.addEventListener('mousedown',e=>{
    e.preventDefault();sidebarResizing=true;
    $sidebar.classList.add('resizing');$sbResizer.classList.add('active');
    document.body.style.userSelect='none';
  });
  // Output panel drag-to-resize
  const $outResizer=document.getElementById('outputResizer');
  $outResizer.addEventListener('mousedown',e=>{
    e.preventDefault();outputResizing=true;
    $outResizer.classList.add('active');
    document.body.style.userSelect='none';
  });
  document.addEventListener('mousemove',e=>{
    if(sidebarResizing){
      const w=Math.max(160,Math.min(e.clientX,560));
      $sidebar.style.width=w+'px';
    }
    if(outputResizing){
      const rect=$outputPanel.parentElement.getBoundingClientRect();
      const h=Math.max(80,Math.min(rect.bottom-e.clientY,rect.height-100));
      $outputContent.style.maxHeight=h+'px';
    }
  });
  document.addEventListener('mouseup',()=>{
    if(sidebarResizing){sidebarResizing=false;$sidebar.classList.remove('resizing');$sbResizer.classList.remove('active');document.body.style.userSelect='';if(S.activeTabId)scheduleUpdate()}
    if(outputResizing){outputResizing=false;$outResizer.classList.remove('active');document.body.style.userSelect=''}
  });
}

function sendAI(){
  const text=$aiInput.value.trim();if(!text)return;
  addMsg(text,true);$aiInput.value='';
  const resp=processAI(text);
  if(resp!==null)setTimeout(()=>addMsg(resp,false),150);
}

/* ===== AUTO-SAVE ===== */
function startAutoSave(){setInterval(()=>{if(S.dirty.size>0)persist()},CFG.autoSaveMs)}

/* ===== INIT ===== */
function init(){
  $menu=document.getElementById('menuBtn');
  $sidebar=document.getElementById('sidebar');
  $fileTree=document.getElementById('fileTree');
  $tabList=document.getElementById('tabList');
  $welcome=document.getElementById('welcomeScreen');
  $edWrap=document.getElementById('editorWrapper');
  $edScroll=document.getElementById('editorScroll');
  $edInner=document.getElementById('editorInner');
  $hlLayer=document.getElementById('highlightLayer');
  $input=document.getElementById('inputLayer');
  $lnNums=document.getElementById('lineNumbers');
  $minimap=document.getElementById('minimap');
  $findBar=document.getElementById('findBar');
  $findInput=document.getElementById('findInput');
  $findInfo=document.getElementById('findInfo');
  $replaceRow=document.getElementById('replaceRow');
  $replaceInput=document.getElementById('replaceInput');
  $cmdPalette=document.getElementById('cmdPalette');
  $cpInput=document.getElementById('cpInput');
  $cpResults=document.getElementById('cpResults');
  $cpOverlay=document.getElementById('cpOverlay');
  $ctxMenu=document.getElementById('ctxMenu');
  $aiMsgs=document.getElementById('aiMessages');
  $aiInput=document.getElementById('aiInput');
  $aiSection=document.getElementById('aiSection');
  $stCursor=document.getElementById('stCursor');
  $stLang=document.getElementById('stLang');
  $titleCenter=document.getElementById('titleCenter');
  $outputPanel=document.getElementById('outputPanel');
  $outputContent=document.getElementById('outputContent');
  $toastContainer=document.getElementById('toastContainer');

  measureChar();
  if(!loadPersist())defaultProject();
  document.getElementById('aiChev').innerHTML=IC.chevR;
  setupEvents();
  renderTree();renderTabs();showWelcome();updateStatusBar();
  startAutoSave();
  addMsg('Type "help" for available commands.',false);
}

document.addEventListener('DOMContentLoaded',init);
})();