import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../redux/features/store";
import {
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  TableIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
// npm i lucide-react
import {
  LayoutDashboard, Settings, Monitor,
  Cpu, IdCard, ClipboardList,
  BarChart3, CalendarCheck2, Star,
  Bell, Users, CalendarRange, CalendarDays,
  Plane, Clock, Timer,
  Building2, UserCog, SlidersHorizontal, FileText, Calendar, FileCheck, ClockAlert, MapPin,
} from "lucide-react";

// Nếu muốn hiện icon ở submenu:
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; icon?: React.ReactNode }[];
};


// ✅ Danh sách menu gốc
// ✅ Danh sách menu gốc (đã gán icon lucide-react)
const navItems: NavItem[] = [
  { icon: <LayoutDashboard className="size-5" />, name: "Dashboard", path: "/" },

  {
    name: "System Configuration",
    icon: <Settings className="size-5" />,
    subItems: [
      // { name: "Departments", path: "/department-config", icon: <Building2 className="size-4" /> },
      // { name: "User Accounts", path: "/user-account-config", icon: <UserCog className="size-4" /> },
      { name: "Leave Types", path: "/leave-type-config", icon: <FileText className="size-4" /> },
      { name: "Holidays", path: "/holiday-config", icon: <Calendar className="size-4" /> },
      { name: "Setting Configuration", path: "/setting-config", icon: <MapPin className="size-4" /> },
    ],
  },

  {
    name: "Departments",
    icon: <Building2 className="size-5" />,
    path: "/department-config",
  },
  {
    name: "User Accounts",
    icon: <UserCog className="size-5" />,
    path: "/user-account-config",
  },
  {
    name: "FaceID",
    icon: <IdCard className="size-5" />,
    path: "/faceid-request",
  },

  { name: "Attendence Report", path: "/attendence-report", icon: <CalendarCheck2 className="size-5" /> },
  { name: "Employee List", icon: <Users className="size-5" />, path: "/employee-list" },
  { name: "Schedule", path: "/employee-schedule", icon: <CalendarDays className="size-5" /> },
  { name: "Work Schedule", path: "/work-schedule", icon: <CalendarRange className="size-5" /> },
  { name: "Leave Requests", path: "/leave-requests", icon: <FileCheck className="size-5" /> },
  { name: "Overtime Requests", path: "/overtime-requests", icon: <ClockAlert className="size-5" /> },
];


const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const userRole = useSelector(
    (state: RootState) => state.auth.userState?.data?.user?.role
  );

  // ✅ Lọc menu theo role

const filteredNavItems = useMemo<NavItem[]>(() => {
  if (userRole === "ADMIN") {
    const allowedForAdmin = [
      "Dashboard",
      "System Configuration",
      "Departments",
      "User Accounts",
      "FaceID",
    ];
    return navItems.filter((item) => allowedForAdmin.includes(item.name));
  }

  if (userRole === "HR_MANAGER") {
    const allowedForHR = ["Attendence Report", "Employee List", "Schedule", "Work Schedule","Leave Requests", "Overtime Requests"];
    return navItems.filter((item) => allowedForHR.includes(item.name));
  }

  if (userRole === "DEPARTMENT_MANAGER") {
    const allowedForDM = ["Attendence Report", "Employee List", "Schedule", "Leave Requests", "Overtime Requests"];
    return navItems.filter((item) => allowedForDM.includes(item.name));
  }

  return [];
}, [userRole]);


  // Trạng thái submenu mở
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Tự mở submenu nếu có đường dẫn con trùng khớp
  // useEffect(() => {
  //   filteredNavItems.forEach((nav, index) => {
  //     if (nav.subItems?.some((sub) => isActive(sub.path))) {
  //       setOpenSubmenu(index);
  //     }
  //   });
  // }, [filteredNavItems, isActive]);
useEffect(() => {
  const indexToOpen = filteredNavItems.findIndex(
    (nav) => nav.subItems?.some((sub) => sub.path === location.pathname)
  );

  if (indexToOpen !== -1) {
    setOpenSubmenu(indexToOpen);
  } else {
    // nếu không có submenu nào chứa path hiện tại thì không ép mở cái nào
    setOpenSubmenu(null);
  }
}, [location.pathname, filteredNavItems]);

  // Ghi nhớ chiều cao submenu
  useEffect(() => {
    if (openSubmenu !== null && subMenuRefs.current[openSubmenu]) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
      }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) =>
    setOpenSubmenu((prev) => (prev === index ? null : index));

  // ✅ Render menu
  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index)}
              className={`menu-item group ${
                openSubmenu === index ? "menu-item-active" : "menu-item-inactive"
              } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className={`menu-item-icon-size ${openSubmenu === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="menu-item-text">{nav.name}</span>
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform ${
                      openSubmenu === index ? "rotate-180 text-brand-500" : ""
                    }`}
                  />
                </>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => (subMenuRefs.current[index] = el)}
              className="overflow-hidden transition-all duration-300"
              style={{
                height: openSubmenu === index ? `${subMenuHeight[index]}px` : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((sub) => (
                  <li key={sub.name}>
                    <Link
  to={sub.path}
  className={`menu-dropdown-item ${
    isActive(sub.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
  } flex items-center gap-2`}
>
  {sub.icon && <span className="w-4 h-4 shrink-0">{sub.icon}</span>}
  <span>{sub.name}</span>
</Link>

                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  // ✅ Giao diện chính
  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 h-screen transition-all duration-300 border-r border-gray-200 z-50
      ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
      ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <img src="/zentry-logo.png" alt="Zentry Logo" width={250} height={250} className="object-contain" />
          ) : (
            <img src="/zentry-logo.png" alt="Zentry Logo" width={70} height={70} className="object-contain" />
          )}
        </Link>
      </div>

      {/* Menu */}
      <div className="flex flex-col overflow-y-auto no-scrollbar duration-300">
        <nav className="mb-6">
          <h2
            className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
              !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
            }`}
          >
            {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots className="size-6" />}
          </h2>
          {renderMenuItems(filteredNavItems)}
        </nav>
        {(isExpanded || isHovered || isMobileOpen) && <SidebarWidget />}
      </div>
    </aside>
  );
};

export default AppSidebar;
