import { useAuthStore } from '@/store/authStore'

export function ProfilePage() {
  const { user } = useAuthStore()
  const allowedPages = user?.allowedPages ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-600">Account</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          My profile
        </h1>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Account details
        </h2>
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Name</dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">{user?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="mt-1 break-all font-medium text-slate-900 dark:text-slate-100">{user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Phone</dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">{user?.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Role</dt>
            <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">{user?.role || '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Page access
        </h2>
        {allowedPages.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Your page access is managed by your administrator.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {allowedPages.map((page) => (
              <li
                key={page}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {page}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
