
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'failure') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
        switch (type) {
        case 'light': 
            navigator.vibrate(10); 
            break;
        case 'medium': 
            navigator.vibrate(40); 
            break;
        case 'heavy': 
            navigator.vibrate([100, 50, 100]); 
            break;
        case 'success': 
            navigator.vibrate([50, 50, 50]); 
            break;
        case 'failure': 
            navigator.vibrate([200, 100, 200]); 
            break;
        }
    } catch (e) {
        // Haptics might be blocked or unsupported
        console.debug("Haptics failed:", e);
    }
  }
};
