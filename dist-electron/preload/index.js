"use strict";
function domReady(condition = ["complete", "interactive"]) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}
const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  }
};
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");
  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;
  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}
const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);
window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};
setTimeout(removeLoading, 4999);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzIjpbIi4uLy4uL2VsZWN0cm9uL3ByZWxvYWQvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gZG9tUmVhZHkoXG4gIGNvbmRpdGlvbjogRG9jdW1lbnRSZWFkeVN0YXRlW10gPSBbJ2NvbXBsZXRlJywgJ2ludGVyYWN0aXZlJ10sXG4pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgaWYgKGNvbmRpdGlvbi5pbmNsdWRlcyhkb2N1bWVudC5yZWFkeVN0YXRlKSkge1xuICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsICgpID0+IHtcbiAgICAgICAgaWYgKGNvbmRpdGlvbi5pbmNsdWRlcyhkb2N1bWVudC5yZWFkeVN0YXRlKSkge1xuICAgICAgICAgIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmNvbnN0IHNhZmVET00gPSB7XG4gIGFwcGVuZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBjaGlsZDogSFRNTEVsZW1lbnQpIHtcbiAgICBpZiAoIUFycmF5LmZyb20ocGFyZW50LmNoaWxkcmVuKS5maW5kKChlKSA9PiBlID09PSBjaGlsZCkpIHtcbiAgICAgIHJldHVybiBwYXJlbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIH1cbiAgfSxcbiAgcmVtb3ZlKHBhcmVudDogSFRNTEVsZW1lbnQsIGNoaWxkOiBIVE1MRWxlbWVudCkge1xuICAgIGlmIChBcnJheS5mcm9tKHBhcmVudC5jaGlsZHJlbikuZmluZCgoZSkgPT4gZSA9PT0gY2hpbGQpKSB7XG4gICAgICByZXR1cm4gcGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICB9XG4gIH0sXG59O1xuXG4vKipcbiAqIGh0dHBzOi8vdG9iaWFzYWhsaW4uY29tL3NwaW5raXRcbiAqIGh0dHBzOi8vY29ubm9yYXRoZXJ0b24uY29tL2xvYWRlcnNcbiAqIGh0dHBzOi8vcHJvamVjdHMubHVrZWhhYXMubWUvY3NzLWxvYWRlcnNcbiAqIGh0dHBzOi8vbWF0ZWprdXN0ZWMuZ2l0aHViLmlvL1NwaW5UaGF0U2hpdFxuICovXG5mdW5jdGlvbiB1c2VMb2FkaW5nKCkge1xuICBjb25zdCBjbGFzc05hbWUgPSBgbG9hZGVycy1jc3NfX3NxdWFyZS1zcGluYDtcbiAgY29uc3Qgc3R5bGVDb250ZW50ID0gYFxuQGtleWZyYW1lcyBzcXVhcmUtc3BpbiB7XG4gIDI1JSB7IHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTAwcHgpIHJvdGF0ZVgoMTgwZGVnKSByb3RhdGVZKDApOyB9XG4gIDUwJSB7IHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTAwcHgpIHJvdGF0ZVgoMTgwZGVnKSByb3RhdGVZKDE4MGRlZyk7IH1cbiAgNzUlIHsgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgwKSByb3RhdGVZKDE4MGRlZyk7IH1cbiAgMTAwJSB7IHRyYW5zZm9ybTogcGVyc3BlY3RpdmUoMTAwcHgpIHJvdGF0ZVgoMCkgcm90YXRlWSgwKTsgfVxufVxuLiR7Y2xhc3NOYW1lfSA+IGRpdiB7XG4gIGFuaW1hdGlvbi1maWxsLW1vZGU6IGJvdGg7XG4gIHdpZHRoOiA1MHB4O1xuICBoZWlnaHQ6IDUwcHg7XG4gIGJhY2tncm91bmQ6ICNmZmY7XG4gIGFuaW1hdGlvbjogc3F1YXJlLXNwaW4gM3MgMHMgY3ViaWMtYmV6aWVyKDAuMDksIDAuNTcsIDAuNDksIDAuOSkgaW5maW5pdGU7XG59XG4uYXBwLWxvYWRpbmctd3JhcCB7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgdG9wOiAwO1xuICBsZWZ0OiAwO1xuICB3aWR0aDogMTAwdnc7XG4gIGhlaWdodDogMTAwdmg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBiYWNrZ3JvdW5kOiAjMjgyYzM0O1xuICB6LWluZGV4OiA5O1xufVxuICAgIGA7XG4gIGNvbnN0IG9TdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gIGNvbnN0IG9EaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICBvU3R5bGUuaWQgPSAnYXBwLWxvYWRpbmctc3R5bGUnO1xuICBvU3R5bGUuaW5uZXJIVE1MID0gc3R5bGVDb250ZW50O1xuICBvRGl2LmNsYXNzTmFtZSA9ICdhcHAtbG9hZGluZy13cmFwJztcbiAgb0Rpdi5pbm5lckhUTUwgPSBgPGRpdiBjbGFzcz1cIiR7Y2xhc3NOYW1lfVwiPjxkaXY+PC9kaXY+PC9kaXY+YDtcblxuICByZXR1cm4ge1xuICAgIGFwcGVuZExvYWRpbmcoKSB7XG4gICAgICBzYWZlRE9NLmFwcGVuZChkb2N1bWVudC5oZWFkLCBvU3R5bGUpO1xuICAgICAgc2FmZURPTS5hcHBlbmQoZG9jdW1lbnQuYm9keSwgb0Rpdik7XG4gICAgfSxcbiAgICByZW1vdmVMb2FkaW5nKCkge1xuICAgICAgc2FmZURPTS5yZW1vdmUoZG9jdW1lbnQuaGVhZCwgb1N0eWxlKTtcbiAgICAgIHNhZmVET00ucmVtb3ZlKGRvY3VtZW50LmJvZHksIG9EaXYpO1xuICAgIH0sXG4gIH07XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgeyBhcHBlbmRMb2FkaW5nLCByZW1vdmVMb2FkaW5nIH0gPSB1c2VMb2FkaW5nKCk7XG5kb21SZWFkeSgpLnRoZW4oYXBwZW5kTG9hZGluZyk7XG5cbndpbmRvdy5vbm1lc3NhZ2UgPSAoZXYpID0+IHtcbiAgZXYuZGF0YS5wYXlsb2FkID09PSAncmVtb3ZlTG9hZGluZycgJiYgcmVtb3ZlTG9hZGluZygpO1xufTtcblxuc2V0VGltZW91dChyZW1vdmVMb2FkaW5nLCA0OTk5KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsU0FBUyxTQUNQLFlBQWtDLENBQUMsWUFBWSxhQUFhLEdBQzVEO0FBQ08sU0FBQSxJQUFJLFFBQVEsQ0FBQyxZQUFZO0FBQzlCLFFBQUksVUFBVSxTQUFTLFNBQVMsVUFBVSxHQUFHO0FBQzNDLGNBQVEsSUFBSTtBQUFBLElBQUEsT0FDUDtBQUNJLGVBQUEsaUJBQWlCLG9CQUFvQixNQUFNO0FBQ2xELFlBQUksVUFBVSxTQUFTLFNBQVMsVUFBVSxHQUFHO0FBQzNDLGtCQUFRLElBQUk7QUFBQSxRQUNkO0FBQUEsTUFBQSxDQUNEO0FBQUEsSUFDSDtBQUFBLEVBQUEsQ0FDRDtBQUNIO0FBRUEsTUFBTSxVQUFVO0FBQUEsRUFDZCxPQUFPLFFBQXFCLE9BQW9CO0FBQzFDLFFBQUEsQ0FBQyxNQUFNLEtBQUssT0FBTyxRQUFRLEVBQUUsS0FBSyxDQUFDLE1BQU0sTUFBTSxLQUFLLEdBQUc7QUFDbEQsYUFBQSxPQUFPLFlBQVksS0FBSztBQUFBLElBQ2pDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTyxRQUFxQixPQUFvQjtBQUMxQyxRQUFBLE1BQU0sS0FBSyxPQUFPLFFBQVEsRUFBRSxLQUFLLENBQUMsTUFBTSxNQUFNLEtBQUssR0FBRztBQUNqRCxhQUFBLE9BQU8sWUFBWSxLQUFLO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBQ0Y7QUFRQSxTQUFTLGFBQWE7QUFDcEIsUUFBTSxZQUFZO0FBQ2xCLFFBQU0sZUFBZTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEdBT3BCLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQW9CSixRQUFBLFNBQVMsU0FBUyxjQUFjLE9BQU87QUFDdkMsUUFBQSxPQUFPLFNBQVMsY0FBYyxLQUFLO0FBRXpDLFNBQU8sS0FBSztBQUNaLFNBQU8sWUFBWTtBQUNuQixPQUFLLFlBQVk7QUFDWixPQUFBLFlBQVksZUFBZSxTQUFTO0FBRWxDLFNBQUE7QUFBQSxJQUNMLGdCQUFnQjtBQUNOLGNBQUEsT0FBTyxTQUFTLE1BQU0sTUFBTTtBQUM1QixjQUFBLE9BQU8sU0FBUyxNQUFNLElBQUk7QUFBQSxJQUNwQztBQUFBLElBQ0EsZ0JBQWdCO0FBQ04sY0FBQSxPQUFPLFNBQVMsTUFBTSxNQUFNO0FBQzVCLGNBQUEsT0FBTyxTQUFTLE1BQU0sSUFBSTtBQUFBLElBQ3BDO0FBQUEsRUFBQTtBQUVKO0FBSUEsTUFBTSxFQUFFLGVBQWUsa0JBQWtCO0FBQ3pDLFdBQVcsS0FBSyxhQUFhO0FBRTdCLE9BQU8sWUFBWSxDQUFDLE9BQU87QUFDdEIsS0FBQSxLQUFLLFlBQVksbUJBQW1CLGNBQWM7QUFDdkQ7QUFFQSxXQUFXLGVBQWUsSUFBSTsifQ==
