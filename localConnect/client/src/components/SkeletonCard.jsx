export const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm animate-pulse space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="space-y-1.5 flex-1">
        <div className="h-3.5 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-100 rounded w-1/4" />
      </div>
    </div>
    <div className="h-4 bg-slate-200 rounded w-3/4" />
    <div className="h-3.5 bg-slate-100 rounded w-full" />
    <div className="h-3.5 bg-slate-100 rounded w-5/6" />
  </div>
);

