const sizeMap = { sm: 48, md: 80, lg: 120, xl: 160 };

export default function AiOrb({ size = 'md', color = 'purple' }) {
    const px = sizeMap[size] ?? 80;
    const colorMap = {
        purple: ['#a855f7', '#ec4899'],
        blue: ['#3b82f6', '#06b6d4'],
        green: ['#22c55e', '#10b981'],
    };
    const [from, to] = colorMap[color] ?? colorMap.purple;

    return (
        <div
            style={{ width: px, height: px }}
            className="relative flex items-center justify-center mx-auto"
        >
            <div
                style={{
                    width: px,
                    height: px,
                    background: `radial-gradient(circle at 35% 35%, ${from}, ${to})`,
                    borderRadius: '50%',
                    filter: 'blur(2px)',
                    opacity: 0.85,
                }}
                className="animate-pulse"
            />
            <div
                style={{
                    position: 'absolute',
                    width: px * 0.55,
                    height: px * 0.55,
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '50%',
                    top: '15%',
                    left: '18%',
                    filter: 'blur(4px)',
                }}
            />
        </div>
    );
}
