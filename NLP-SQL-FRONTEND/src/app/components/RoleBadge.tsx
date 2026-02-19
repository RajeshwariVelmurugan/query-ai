type Role = "Admin" | "Analyst" | "Viewer";

interface RoleBadgeProps {
  role: Role;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const roleConfig = {
    Admin: "from-[#EF4444]/20 to-[#DC2626]/20 text-[#EF4444] border-[#EF4444]/30",
    Analyst: "from-[#4F46E5]/20 to-[#9333EA]/20 text-[#4F46E5] border-[#4F46E5]/30",
    Viewer: "from-[#64748B]/20 to-[#475569]/20 text-[#64748B] border-[#64748B]/30",
  };

  return (
    <span
      className={`inline-flex items-center h-6 px-3 rounded-full text-xs font-medium bg-gradient-to-r border ${roleConfig[role]}`}
    >
      {role}
    </span>
  );
}
