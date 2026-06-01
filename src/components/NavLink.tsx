type Props = {
  to: string;
  icon: React.ReactNode;
  label: string;
};

export function NavLink({ to, icon, label }: Props) {
  const active = window.location.hash === `#${to}` ||
    (window.location.hash === '' && to === 'dashboard');

  return (
    <a
      href={`#${to}`}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      {icon}
      {label}
    </a>
  );
}
