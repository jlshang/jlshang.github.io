/* Hand-drawn SVG icon set (no emoji). UI icons use currentColor; ITEMS are flat colored food drawings. */
(function(){
  function ui(p){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
  var ICON={
    brain:ui('<path d="M9.5 3.5A2.5 2.5 0 0 0 7 6v.2A3 3 0 0 0 4.5 9.5a3 3 0 0 0 .7 1.9A3.2 3.2 0 0 0 5 16a3 3 0 0 0 3 3 2.5 2.5 0 0 0 4-.4V6a2.5 2.5 0 0 0-2.5-2.5z"/><path d="M14.5 3.5A2.5 2.5 0 0 1 17 6v.2a3 3 0 0 1 2.5 3.3 3 3 0 0 1-.7 1.9A3.2 3.2 0 0 1 19 16a3 3 0 0 1-3 3 2.5 2.5 0 0 1-4-.4"/><path d="M9 9.5h1.5M13.5 13H15"/>'),
    focus:ui('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>'),
    memory:ui('<rect x="3" y="6" width="11" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/><path d="M8.5 11.5l1.5 1.5 3-3"/>'),
    math:ui('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
    words:ui('<path d="M4 19l5-14h1l5 14"/><path d="M6 14h7"/><path d="M17 10v9"/><path d="M20 13a3 3 0 1 0 0 3"/>'),
    observation:ui('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M8 9a3 3 0 0 1 3-2"/>'),
    logic:ui('<rect x="3" y="3" width="7" height="7" rx="1.5"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="M6.5 14l3.5 7H3z"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    colors:ui('<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.5-1.2-1.8-1.2-3 0-1 .8-1.8 2-1.8H17a4 4 0 0 0 4-4C21 6.5 17 3 12 3z"/><circle cx="7.5" cy="11" r="1" fill="currentColor"/><circle cx="10" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7" r="1" fill="currentColor"/>'),
    grid:ui('<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>'),
    cart:ui('<path d="M3 4h2.5l2.2 11h10.6L21 8H7"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>'),
    cash:ui('<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v5M18 9.5v5"/>'),
    tag:ui('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/>'),
    receipt:ui('<path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
    scroll:ui('<path d="M8 3h11a2 2 0 0 1 0 4h-2v12a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h2V5a2 2 0 0 0-2-2"/><path d="M11 10h3M11 14h3"/>'),
    sequence:ui('<path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/>'),
    speaker:ui('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    home:ui('<path d="M3.5 11L12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>'),
    globe:ui('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
    arrow:ui('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    chevron:ui('<path d="M9 5l7 7-7 7"/>'),
    star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>',
    check:ui('<path d="M4.5 12.5l5 5L20 7"/>'),
    flag:ui('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
    back:ui('<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 10h-1"/>')
  };
  function item(p){return '<svg viewBox="0 0 48 48" aria-hidden="true">'+p+'</svg>'}
  var ITEMS={
    apple:{en:'Apples',zh:'苹果',svg:item('<path d="M24 15c-3-3-13-3-15 6-2 9 5 21 10 21 2 0 3-1 5-1s3 1 5 1c5 0 12-12 10-21-2-9-12-9-15-6z" fill="#D94A3D"/><path d="M24 15c0-4 1-7 4-10" stroke="#6B4A2B" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M26 11c3-4 8-5 11-3-2 4-7 5-11 3z" fill="#4E9A4E"/>')},
    banana:{en:'Bananas',zh:'香蕉',svg:item('<path d="M9 13c1 15 14 26 30 22 3-1 4-3 2-5-12 2-23-5-26-18-1-3-6-3-6 1z" fill="#F2C744"/><path d="M9 13c1 15 14 26 30 22" stroke="#D9A21E" stroke-width="2" fill="none"/><path d="M10 13L8 8" stroke="#6B4A2B" stroke-width="3" stroke-linecap="round"/>')},
    bread:{en:'Bread',zh:'面包',svg:item('<path d="M7 21c0-8 8-12 17-12s17 4 17 12c0 3-2 5-4 5v13H11V26c-2 0-4-2-4-5z" fill="#DDA55E"/><path d="M11 26h26" stroke="#B97D3A" stroke-width="2"/><path d="M17 16c2-1 4-1 6 0M26 16c2-1 4-1 6 0" stroke="#B97D3A" stroke-width="2" fill="none" stroke-linecap="round"/>')},
    milk:{en:'Milk',zh:'牛奶',svg:item('<path d="M15 17l4-9h10l4 9v24H15z" fill="#FFFFFF" stroke="#3E7CB1" stroke-width="2.5" stroke-linejoin="round"/><path d="M15 17h18" stroke="#3E7CB1" stroke-width="2.5"/><rect x="19" y="24" width="10" height="9" rx="2" fill="#3E7CB1"/>')},
    egg:{en:'Eggs',zh:'鸡蛋',svg:item('<path d="M24 6c7 0 13 11 13 20a13 13 0 0 1-26 0C11 17 17 6 24 6z" fill="#F6E7CF" stroke="#C9A77A" stroke-width="2"/><path d="M18 20c1-4 3-7 5-8" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round"/>')},
    carrot:{en:'Carrots',zh:'胡萝卜',svg:item('<path d="M31 15L9 41c-1 1 0 2 1 1l28-20c3-3-4-10-7-7z" fill="#E9812F"/><path d="M20 30l3 2M16 35l3 2M25 24l3 2" stroke="#C4621B" stroke-width="2" stroke-linecap="round"/><path d="M33 14c-1-4 0-8 3-10M35 17c3-2 7-2 9 0M34 15c2-3 6-5 9-4" stroke="#4E9A4E" stroke-width="2.5" fill="none" stroke-linecap="round"/>')},
    tomato:{en:'Tomatoes',zh:'西红柿',svg:item('<circle cx="24" cy="28" r="14" fill="#E0493C"/><path d="M24 15l-6-3 2 5-6 1 6 2M24 15l6-3-2 5 6 1-6 2M24 15V9" stroke="#3F8A45" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')},
    fish:{en:'Fish',zh:'鱼',svg:item('<path d="M5 24c6-9 19-13 29-5l9-6v22l-9-6C24 37 11 33 5 24z" fill="#4F8FC9"/><path d="M22 17c2 4 2 10 0 14" stroke="#3A6E9E" stroke-width="2" fill="none"/><circle cx="13" cy="22" r="2" fill="#FFFFFF"/>')},
    cheese:{en:'Cheese',zh:'奶酪',svg:item('<path d="M5 30l31-17 7 5v18H5z" fill="#F2C744"/><path d="M5 30h38" stroke="#D9A21E" stroke-width="2"/><circle cx="17" cy="37" r="2.5" fill="#D9A21E"/><circle cx="32" cy="35" r="2" fill="#D9A21E"/><circle cx="28" cy="23" r="1.8" fill="#D9A21E"/>')},
    cup:{en:'Coffee',zh:'茶叶',svg:item('<path d="M9 19h25v9a12.5 12.5 0 0 1-25 0z" fill="#8A5A3B"/><path d="M34 22h3a5 5 0 0 1 0 10h-4" stroke="#8A5A3B" stroke-width="3" fill="none"/><path d="M17 7c-2 3 2 5 0 8M24 7c-2 3 2 5 0 8" stroke="#B59A86" stroke-width="2" fill="none" stroke-linecap="round"/>')},
    orange:{en:'Oranges',zh:'橘子',svg:item('<circle cx="24" cy="27" r="15" fill="#F08A24"/><path d="M24 12c2-4 7-5 10-3-2 4-6 5-10 3z" fill="#4E9A4E"/><circle cx="19" cy="23" r="1.3" fill="#F7B267"/><circle cx="29" cy="31" r="1.3" fill="#F7B267"/><circle cx="27" cy="21" r="1.3" fill="#F7B267"/>')},
    potato:{en:'Potatoes',zh:'土豆',svg:item('<path d="M8 27c-2-10 7-16 17-15 11 1 16 7 14 16-2 10-11 12-18 11-7-1-12-4-13-12z" fill="#C8A06A"/><circle cx="19" cy="23" r="1.6" fill="#9C7743"/><circle cx="30" cy="29" r="1.6" fill="#9C7743"/><circle cx="21" cy="33" r="1.3" fill="#9C7743"/>')},
    grapes:{en:'Grapes',zh:'葡萄',svg:item('<g fill="#7B4FA8"><circle cx="18" cy="18" r="5"/><circle cx="29" cy="18" r="5"/><circle cx="23.5" cy="26" r="5"/><circle cx="13" cy="26" r="5"/><circle cx="34" cy="26" r="5"/><circle cx="18" cy="34" r="5"/><circle cx="29" cy="34" r="5"/><circle cx="23.5" cy="41" r="4.5"/></g><path d="M24 13V6" stroke="#6B4A2B" stroke-width="2.5" stroke-linecap="round"/><path d="M25 9c4-3 9-3 11 0-3 3-8 3-11 0z" fill="#4E9A4E"/>')},
    corn:{en:'Corn',zh:'玉米',svg:item('<ellipse cx="24" cy="21" rx="8" ry="15" fill="#F2C744"/><path d="M19 12h10M17 18h14M17 24h14M18 30h12M20 10v22M24 7v28M28 10v22" stroke="#D9A21E" stroke-width="1.5"/><path d="M24 44c-8-2-13-10-13-20 4 4 8 8 13 10 5-2 9-6 13-10 0 10-5 18-13 20z" fill="#5FA052"/>')},
    pear:{en:'Pears',zh:'梨',svg:item('<path d="M24 12c-5 0-6 5-7 10-1 4-7 7-7 13 0 6 6 9 14 9s14-3 14-9c0-6-6-9-7-13-1-5-2-10-7-10z" fill="#B7CC4A"/><path d="M24 12c0-3 1-5 3-7" stroke="#6B4A2B" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M26 8c3-3 7-3 9-1-2 3-6 3-9 1z" fill="#4E9A4E"/>')},
    rice:{en:'Rice',zh:'大米',svg:item('<path d="M9 23c0-7 7-10 15-10s15 3 15 10z" fill="#FFFFFF" stroke="#D8D2C4" stroke-width="1.5"/><path d="M5 23h38a19 19 0 0 1-38 0z" fill="#3E7CB1"/><path d="M11 30h26" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3 3"/>')}
  };
  window.ICON=ICON; window.ITEMS=ITEMS;
})();
