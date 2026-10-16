(()=>{'use strict';const mount=s=>{if(s&&window.EDIFIQObrasBridge)window.EDIFIQObrasBridge.mount(s)};addEventListener('edifiq:snapshot',e=>mount(e.detail));mount(window.EDIFIQSnapshot);})();
