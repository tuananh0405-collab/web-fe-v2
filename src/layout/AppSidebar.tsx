import { useCallback, useEffect, useRef, useState } from "react";
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

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string }[];
};

// ✅ Danh sách menu gốc
const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/" },
  {
    name: "System Configuration",
    icon: <ListIcon />,
    subItems: [
      { name: "Departments", path: "/department-config" },
      { name: "User Accounts", path: "/user-account-config" },
      { name: "Attribute Config", path: "/attribute-config" },
    ],
  },
  {
    name: "Devices & FaceID",
    icon: <TableIcon />,
    subItems: [
      { name: "Devices", path: "/device-request" },
      { name: "FaceID ", path: "/faceid-request" },
      { name: "FaceID Request", path: "/faceid-request" },
    ],
  },
  {
    icon: <CalenderIcon />,
    name: "Reports",
    subItems: [
      { name: "Attendence Report", path: "/attendence-report" },
      { name: "Highlight Report", path: "/highlight-report" },
    ],
  },
  { icon: <CalenderIcon />, name: "Attendence Check", path: "/" },
  { icon: <GridIcon />, name: "Notifications", path: "/list-notification" },
  { name: "Employee List", icon: <ListIcon />, path: "/employee-list" },
  {
    name: "Schedule Management",
    icon: <CalenderIcon />,
    subItems: [
      { name: "Schedule", path: "/employee-schedule" },
      { name: "Leaves", path: "/leaves" },
      { name: "Shifts", path: "/shifts" },
      { name: "Overtimes", path: "/overtimes" },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const userRole = useSelector(
    (state: RootState) => state.auth.userState?.data?.user?.role
  );

  // ✅ Lọc menu theo role
  const filteredNavItems = navItems.filter((item) => {
    if (userRole === "ADMIN") {
      const allowedForAdmin = [
        "Dashboard",
        "System Configuration",
        "Devices & FaceID",
        
      ];
      return allowedForAdmin.includes(item.name);
    }

    if (userRole === "HR_MANAGER") {
      const allowedForHR = [
        "Reports",
        
        "Employee List",
      ];
      return allowedForHR.includes(item.name);
    }
    if (userRole === "DM_MANAGER") {
      const allowedForDM = [
        "Schedule Management",
        "Employee List",
      ];
      return allowedForDM.includes(item.name);
    }

    return false; // chưa đăng nhập → không hiển thị gì
  });

  // Trạng thái submenu mở
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>({});
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Tự mở submenu nếu có đường dẫn con trùng khớp
  useEffect(() => {
    filteredNavItems.forEach((nav, index) => {
      if (nav.subItems?.some((sub) => isActive(sub.path))) {
        setOpenSubmenu(index);
      }
    });
  }, [filteredNavItems, isActive]);

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
                        isActive(sub.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {sub.name}
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
            <>
              <img className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" width={150} height={40} />
              <img className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" width={150} height={40} />
            </>
          ) : (
            <img src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
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
