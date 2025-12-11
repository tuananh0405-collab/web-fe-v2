import { Link } from "react-router";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  pageTitle?: string;
  items?: BreadcrumbItem[];
  showTitleLeft?: boolean; // ✅ mới
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle = "",
  items,
  showTitleLeft = true,
}) => {
  const trail: BreadcrumbItem[] =
    items && items.length > 0
      ? items
      : [
          { label: "Home", to: "/" },
          { label: pageTitle },
        ];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      {/* 🔥 Chỉ hiện title bên trái nếu cho phép */}
      {showTitleLeft && (
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {pageTitle}
        </h2>
      )}

      <nav className="ml-auto">
        <ol className="flex items-center gap-1.5">
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;

            return (
              <li key={index} className="flex items-center gap-1.5">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="text-sm text-gray-500 dark:text-gray-400"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {item.label}
                  </span>
                )}

                {!isLast && (
                  <svg
                    className="stroke-current text-gray-400 dark:text-gray-500"
                    width="17"
                    height="16"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
