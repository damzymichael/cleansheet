import { useState, useCallback, useRef, useEffect } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>, threshold = 80) {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const startY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        // Only trigger pull to refresh if we're at the top of the container
        if (containerRef.current && containerRef.current.scrollTop <= 0) {
            startY.current = e.touches[0].pageY;
            setIsReady(true);
        } else {
            startY.current = 0;
            setIsReady(false);
        }
    }, []);

    const handleTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isReady || isRefreshing || startY.current === 0) return;

            const currentY = e.touches[0].pageY;
            const diff = currentY - startY.current;

            if (diff > 0) {
                // Apply tension (resistance) to the pull
                const pull = Math.min(diff * 0.4, threshold + 30);
                setPullDistance(pull);

                // Prevent standard browser pull-to-refresh if we're active
                if (diff > 5) {
                    if (e.cancelable) e.preventDefault();
                }
            } else {
                setPullDistance(0);
                setIsReady(false);
            }
        },
        [isReady, isRefreshing, threshold],
    );

    const handleTouchEnd = useCallback(async () => {
        if (!isReady || isRefreshing) return;

        if (pullDistance >= threshold) {
            setIsRefreshing(true);
            setPullDistance(threshold);
            try {
                await onRefresh();
            } finally {
                // Small delay to let the user see the "Updating" state
                setTimeout(() => {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }, 500);
            }
        } else {
            setPullDistance(0);
        }
        startY.current = 0;
        setIsReady(false);
    }, [isReady, isRefreshing, pullDistance, threshold, onRefresh]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd);

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return { pullDistance, isRefreshing, containerRef };
}
