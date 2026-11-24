/* LogiTrack homepage interactions — frontend demo only */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(`logitrack:${key}`); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(`logitrack:${key}`, JSON.stringify(value)); } catch {} }
  };
  const shipments = [
    { id:'LT-204183', route:'Agra to Mathura', driver:'Rakesh Yadav', status:'In transit', eta:'Today, 6:30 PM', updated:'2 min ago', origin:'Agra', destination:'Mathura' },
    { id:'LT-204179', route:'Delhi to Jaipur', driver:'Imran Khan', status:'Out for delivery', eta:'Today, 7:15 PM', updated:'8 min ago', origin:'Delhi', destination:'Jaipur' },
    { id:'LT-204171', route:'Mathura to Lucknow', driver:'Suresh Kumar', status:'Delivered', eta:'Delivered at 4:42 PM', updated:'18 min ago', origin:'Mathura', destination:'Lucknow' },
    { id:'LT-204166', route:'Noida to Gwalior', driver:'Deepak Sharma', status:'Picked up', eta:'Tomorrow, 11:00 AM', updated:'31 min ago', origin:'Noida', destination:'Gwalior' },
    { id:'LT-204158', route:'Jaipur to Agra', driver:'Manoj Singh', status:'Delayed', eta:'Tomorrow, 9:30 AM', updated:'46 min ago', origin:'Jaipur', destination:'Agra' }
  ];
  const notifications = [
    { id:'n1', title:'Shipment picked up', detail:'LT-204166 · Noida → Gwalior', time:'12 min ago', read:false },
    { id:'n2', title:'Delivery delayed', detail:'LT-204158 · Jaipur → Agra', time:'28 min ago', read:false },
    { id:'n3', title:'Shipment delivered', detail:'LT-204171 · Mathura → Lucknow', time:'1 hour ago', read:true },
    { id:'n4', title:'Driver assigned', detail:'Imran Khan · LT-204179', time:'2 hours ago', read:true }
  ];
  const toastRegion = $('[data-toast-region]');
  const toast = (message, type='info') => {
    if (!toastRegion) return;
    const node = document.createElement('div');
    node.className = `toast toast-${type}`;
    node.innerHTML = `<span class="toast-mark" aria-hidden="true">${type==='success'?'✓':type==='error'?'!':'i'}</span><span></span><button type="button" aria-label="Dismiss">×</button>`;
    $('span:nth-child(2)', node).textContent = message;
    $('button', node).addEventListener('click', () => node.remove());
    toastRegion.append(node);
    window.setTimeout(() => node.remove(), 4200);
  };

  // Theme
  const themeToggle = $('[data-theme-toggle]');
  const applyTheme = theme => {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) $('[data-theme-label]', themeToggle).textContent = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    store.set('theme', theme);
  };
  applyTheme(store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeToggle?.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

  // Navigation and mobile drawer
  const header = $('.site-header'), menuToggle = $('.menu-toggle'), nav = $('#main-nav');
  const closeMobileNav = () => { header?.classList.remove('nav-open'); menuToggle?.setAttribute('aria-expanded','false'); menuToggle?.setAttribute('aria-label','Open navigation'); document.body.classList.remove('menu-locked'); };
  menuToggle?.addEventListener('click', () => {
    const open = header.classList.toggle('nav-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('menu-locked', open && innerWidth <= 860);
  });
  $$('#main-nav a').forEach(a => a.addEventListener('click', closeMobileNav));
  document.addEventListener('click', e => { if (header?.classList.contains('nav-open') && !header.contains(e.target)) closeMobileNav(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMobileNav(); closePopovers(); closePalette(); } });
  let lastY = 0;
  const progress = $('[data-scroll-progress]'), backTop = $('[data-back-to-top]');
  const onScroll = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header?.classList.toggle('is-scrolled', y > 24);
    header?.classList.toggle('scrolling-down', y > lastY && y > 180);
    lastY = y;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    backTop?.classList.toggle('visible', y > 550);
  };
  window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
  backTop?.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

  // Popovers
  const notifPanel = $('[data-notifications-panel]'), profilePanel = $('[data-profile-panel]');
  const notifButton = $('[data-notifications-toggle]'), profileButton = $('[data-profile-toggle]');
  function closePopovers() {
    [notifPanel,profilePanel].forEach(p => { if (p) p.hidden = true; });
    [notifButton,profileButton].forEach(b => b?.setAttribute('aria-expanded','false'));
  }
  function togglePopover(panel, button) {
    const opening = panel.hidden; closePopovers(); panel.hidden = !opening; button.setAttribute('aria-expanded',String(opening));
  }
  notifButton?.addEventListener('click', e => { e.stopPropagation(); togglePopover(notifPanel,notifButton); });
  profileButton?.addEventListener('click', e => { e.stopPropagation(); togglePopover(profilePanel,profileButton); });
  document.addEventListener('click', e => { if (!e.target.closest('.tool-popover-wrap')) closePopovers(); });
  const notifList = $('[data-notification-list]');
  const renderNotifications = () => {
    const data = store.get('notifications', notifications);
    if (!notifList) return;
    notifList.innerHTML = data.length ? data.map(n => `<button class="notification-item ${n.read?'is-read':''}" data-notification-id="${n.id}"><span class="notification-indicator"></span><span><strong>${n.title}</strong><small>${n.detail}</small><time>${n.time}</time></span></button>`).join('') : '<p class="notification-empty">You are all caught up.</p>';
    const unread = data.filter(n=>!n.read).length;
    $('[data-unread-dot]')?.classList.toggle('has-unread',unread>0);
    if (notifButton) notifButton.setAttribute('aria-label',`Notifications, ${unread} unread`);
  };
  renderNotifications();
  notifList?.addEventListener('click', e => {
    const item = e.target.closest('[data-notification-id]'); if (!item) return;
    const data = store.get('notifications',notifications).map(n=>n.id===item.dataset.notificationId?{...n,read:true}:n);
    store.set('notifications',data); renderNotifications();
  });
  $('[data-mark-all]')?.addEventListener('click',()=>{store.set('notifications',store.get('notifications',notifications).map(n=>({...n,read:true})));renderNotifications();toast('All notifications marked as read.','success');});
  $('[data-clear-notifications]')?.addEventListener('click',()=>{store.set('notifications',[]);renderNotifications();toast('Notification centre cleared.');});
  $('[data-demo-session]')?.addEventListener('click',()=>{closePopovers();toast('You are viewing a demo session; no account was signed out.');});

  // Command palette
  const palette = $('[data-command-backdrop]'), commandInput = $('[data-command-input]'), commandResults = $('[data-command-results]');
  const commands = [
    {label:'Home',group:'Navigate',hint:'Homepage',url:'index.html',keys:'G H'},
    {label:'Track Shipment',group:'Navigate',hint:'Search a delivery',url:'tracking.html',keys:'G T'},
    {label:'Dashboard',group:'Navigate',hint:'Operations overview',url:'dashboard.html'},
    {label:'Manage shipments',group:'Navigate',hint:'Create and edit bookings',url:'shipments.html'},
    {label:'Manage drivers',group:'Navigate',hint:'Driver directory',url:'drivers.html'},
    {label:'Reports',group:'Navigate',hint:'Performance analytics',url:'reports.html'},
    {label:'Contact support',group:'Navigate',hint:'Get help',url:'contact.html'},
    {label:'Create a shipment',group:'Quick actions',hint:'Open shipment management',url:'shipments.html'},
    ...shipments.map(s=>({label:s.id,group:'Demo shipments',hint:`${s.route} · ${s.status}`,url:`tracking.html?trackingId=${s.id}`}))
  ];
  let activeCommand = 0, visibleCommands = commands;
  const renderCommands = () => {
    const q = (commandInput?.value||'').trim().toLowerCase();
    visibleCommands = commands.filter(c => `${c.label} ${c.group} ${c.hint}`.toLowerCase().includes(q));
    activeCommand = Math.min(activeCommand,Math.max(0,visibleCommands.length-1));
    if (!commandResults) return;
    commandResults.innerHTML = visibleCommands.length ? visibleCommands.map((c,i)=>`<button class="command-result ${i===activeCommand?'is-active':''}" data-command-index="${i}"><span class="command-result-icon">${c.group==='Demo shipments'?'⌖':c.group==='Quick actions'?'＋':'↗'}</span><span><strong>${c.label}</strong><small>${c.hint}</small></span><em>${c.group}</em></button>`).join('') : '<div class="command-empty">No results found. Try a shipment ID or page name.</div>';
  };
  const openPalette = () => { closePopovers(); palette.hidden=false; document.body.classList.add('palette-open'); commandInput.value=''; renderCommands(); requestAnimationFrame(()=>commandInput.focus()); };
  function closePalette(){ if (palette && !palette.hidden){palette.hidden=true;document.body.classList.remove('palette-open');} }
  $('[data-command-open]')?.addEventListener('click',openPalette);
  palette?.addEventListener('click',e=>{if(e.target===palette)closePalette();});
  commandInput?.addEventListener('input',()=>{activeCommand=0;renderCommands();});
  commandResults?.addEventListener('click',e=>{const b=e.target.closest('[data-command-index]');if(b)location.href=visibleCommands[Number(b.dataset.commandIndex)].url;});
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();}
    if(palette && !palette.hidden){
      if(e.key==='ArrowDown'){e.preventDefault();activeCommand=Math.min(activeCommand+1,visibleCommands.length-1);renderCommands();}
      if(e.key==='ArrowUp'){e.preventDefault();activeCommand=Math.max(activeCommand-1,0);renderCommands();}
      if(e.key==='Enter'&&visibleCommands[activeCommand])location.href=visibleCommands[activeCommand].url;
    }
  });

  // Shipment tracking card
  const trackInput = $('#trackingId'), clearTrack = $('[data-track-clear]'), recentWrap = $('[data-recent-searches]');
  const recent = store.get('recentShipments',[]);
  const renderRecent = () => {
    if(!recentWrap)return;
    recentWrap.hidden=!recent.length;
    recentWrap.innerHTML=recent.length?`<span>Recent:</span>${recent.map(id=>`<button type="button" data-recent-id="${id}">${id}</button>`).join('')}`:'';
  };
  renderRecent();
  trackInput?.addEventListener('input',()=>{if(clearTrack)clearTrack.hidden=!trackInput.value;});
  clearTrack?.addEventListener('click',()=>{trackInput.value='';clearTrack.hidden=true;trackInput.focus();});
  recentWrap?.addEventListener('click',e=>{const b=e.target.closest('[data-recent-id]');if(b){trackInput.value=b.dataset.recentId;trackInput.form.requestSubmit();}});
  trackInput?.form?.addEventListener('submit',e=>{
    const id=trackInput.value.trim().toUpperCase();
    if(!/^LT-\d{6}$/.test(id)){e.preventDefault();toast('Enter a valid tracking ID, for example LT-204183.','error');trackInput.focus();return;}
    const known=shipments.some(s=>s.id===id);
    if(!known){e.preventDefault();toast('That ID is not in the homepage demo dataset. You can still try it on the tracking page.','warning');return;}
    store.set('recentShipments',[id,...recent.filter(x=>x!==id)].slice(0,5));
    trackInput.value=id;
  });

  // Dispatch board
  const tbody=$('[data-shipment-rows]'), boardSearch=$('[data-board-search]'), boardFilter=$('[data-board-filter]'), boardSort=$('[data-board-sort]');
  const statusClass={'In transit':'status-transit','Out for delivery':'status-out','Delivered':'status-done','Picked up':'status-picked','Delayed':'status-delayed'};
  const renderBoard=()=>{
    if(!tbody)return;
    const q=(boardSearch?.value||'').trim().toLowerCase(), status=boardFilter?.value||'all', sort=boardSort?.value||'id';
    let rows=shipments.filter(s=>(status==='all'||s.status===status)&&`${s.id} ${s.route} ${s.driver}`.toLowerCase().includes(q));
    rows.sort((a,b)=>sort==='route'?a.route.localeCompare(b.route):sort==='status'?a.status.localeCompare(b.status):b.id.localeCompare(a.id));
    tbody.innerHTML=rows.length?rows.map(s=>`<tr><th scope="row"><a class="shipment-row-link" href="tracking.html?trackingId=${s.id}">${s.id}</a></th><td>${s.route}</td><td class="col-driver">${s.driver}</td><td><span class="status ${statusClass[s.status]}">${s.status}</span></td></tr>`).join(''):'<tr><td colspan="4" class="board-empty">No shipments match those filters. Try clearing your search.</td></tr>';
    const count=$('[data-board-count]');if(count)count.textContent=`Showing ${rows.length} of ${shipments.length} demo shipments`;
  };
  [boardSearch,boardFilter,boardSort].forEach(el=>el?.addEventListener(el===boardSearch?'input':'change',renderBoard));
  $('[data-board-clear]')?.addEventListener('click',()=>{boardSearch.value='';boardFilter.value='all';boardSort.value='id';renderBoard();});
  renderBoard();

  // Analytics count-up
  const stats=$$('[data-count]');
  const animateStats=()=>stats.forEach(el=>{
    const target=Number(el.dataset.count), suffix=el.dataset.suffix||'', decimals=String(target).includes('.')?1:0;
    const start=performance.now(), duration=1100;
    const tick=now=>{const p=Math.min((now-start)/duration,1), eased=1-Math.pow(1-p,3), value=target*eased;el.textContent=(decimals?value.toFixed(decimals):Math.round(value).toLocaleString('en-IN'))+suffix;if(p<1)requestAnimationFrame(tick);};
    requestAnimationFrame(tick);
  });
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){animateStats();observer.disconnect();}},{threshold:.3});const statsSection=$('.stats');if(statsSection)observer.observe(statsSection);}else animateStats();

  // Activity feed
  const activity=$('[data-activity-feed]');
  if(activity)activity.innerHTML=[
    ['✓','LT-204171 delivered','Mathura → Lucknow','18 min ago'],
    ['↗','Driver assigned','Imran Khan · LT-204179','2 hours ago'],
    ['⌖','LT-204166 picked up','Noida → Gwalior','Today, 3:10 PM']
  ].map(a=>`<li><span class="activity-icon">${a[0]}</span><span><strong>${a[1]}</strong><small>${a[2]}</small></span><time>${a[3]}</time></li>`).join('');

  // Smart greeting and demo labels
  const greeting=$('[data-smart-greeting]');
  if(greeting){const hour=new Date().getHours();greeting.textContent=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';}
  $('[data-demo-session]')?.setAttribute('title','Demo-only session control');
})();