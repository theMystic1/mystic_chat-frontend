import { useEffect, useState } from "react";

const useKeyboardOffset = () => {
  const [kbOffset, setKbOffset] = useState(0);

  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const onChange = () => {
      // When keyboard opens, visual viewport height shrinks.
      // Offset roughly equals layout viewport height - visual viewport height - viewport offsetTop.
      const layoutH = window.innerHeight;
      const visualH = vv.height;
      const offsetTop = vv.offsetTop ?? 0;

      const raw = Math.max(0, layoutH - visualH - offsetTop);
      setKbOffset(raw);
    };

    onChange();
    vv.addEventListener("resize", onChange);
    vv.addEventListener("scroll", onChange);

    return () => {
      vv.removeEventListener("resize", onChange);
      vv.removeEventListener("scroll", onChange);
    };
  }, []);

  return kbOffset;
};

export default useKeyboardOffset;
