
export default function ProgressBar({ value = 0, max = 100 }) {
    const percentage = Math.max(0, Math.min(100, (value / max) * 100));
    return (
        <div className="progress">
            <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>
    );
}
