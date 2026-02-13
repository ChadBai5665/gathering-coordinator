let mapLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * 动态加载高德地图 JS API
 */
export function loadAMap(): Promise<void> {
  if (mapLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const amapKey = import.meta.env.VITE_AMAP_JS_KEY;
    if (!amapKey) {
      reject(new Error('AMAP JS Key 未配置'));
      return;
    }

    // 设置安全密钥
    const jsSecret = import.meta.env.VITE_AMAP_JS_SECRET;
    if (jsSecret) {
      (window as any)._AMapSecurityConfig = {
        securityJsCode: jsSecret,
      };
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`;
    script.onload = () => {
      mapLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('高德地图加载失败，请检查 Key 或网络'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
