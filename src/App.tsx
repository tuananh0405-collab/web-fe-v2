import { BrowserRouter as Router, Routes, Route } from "react-router";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import Home from "./pages/Dashboard/Home";
import DepartmentConfig from "./pages/SystemConfiguration/DepartmentConfig";
import UserAccountConfig from "./pages/SystemConfiguration/UserAccountConfig";
import AttributeConfig from "./pages/SystemConfiguration/AttributeConfig";
import DeviceRequest from "./pages/DevicesFaceID/DeviceRequest";
import FaceIDRequest from "./pages/DevicesFaceID/FaceIDRequest";
import PendingDevices from "./pages/DevicesFaceID/PendingDevices";
import EmployeeAttendence from "./pages/Attendence/EmployeeAttendence";
import EditAttendenceHistory from "./pages/Attendence/EditAttendenceHistory";
import EmployeeSchedule from "./pages/Schedule/EmployeeSchedule";
import Leaves from "./pages/Schedule/Leaves";
import Shifts from "./pages/Schedule/Shifts";
import Overtimes from "./pages/Schedule/Overtimes";
import AttendenceReport from "./pages/Reports/AttendenceReport";
import HighlightReport from "./pages/Reports/HighlightReport";
import ListNotification from "./pages/Notifications/ListNotification";
import FormElements from "./pages/Forms/FormElements";
import { ScrollToTop } from "./components/common/ScrollToTop";
import UserAccountDetail from "./pages/SystemConfiguration/UserAccountDetail";
import DepartmentDetail from "./pages/SystemConfiguration/DepartmentDetail";
import EmployeeList from "./pages/EmployeeList/EmployeeList";
import EmployeeDetail from "./pages/EmployeeList/EmployeeDetail";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ---------- AUTH ---------- */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/form" element={<FormElements />} />

        {/* ---------- ADMIN ROUTES ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/department-config" element={<DepartmentConfig />} />
            <Route
              path="/department-config/:id"
              element={<DepartmentDetail />}
            />
            <Route
              path="/user-account-config"
              element={<UserAccountConfig />}
            />
            <Route
              path="/user-account-config/:id"
              element={<UserAccountDetail />}
            />
            <Route path="/attribute-config" element={<AttributeConfig />} />
            <Route path="/device-request" element={<DeviceRequest />} />
            <Route
              path="/device-request/pending"
              element={<PendingDevices />}
            />
            <Route path="/faceid-request" element={<FaceIDRequest />} />
          </Route>
        </Route>
{/* ---------- DM ROUTES ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["DEPARTMENT_MANAGER", "HR_MANAGER", "ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/notification-list" element={<ListNotification />} />
          </Route>
        </Route>
{/* ---------- DM, HR ROUTES ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["DEPARTMENT_MANAGER", "HR_MANAGER"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/employee-schedule" element={<EmployeeSchedule />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/overtimes" element={<Overtimes />} />
            <Route path="/employee-list" element={<EmployeeList />} />
            <Route
              path="/employee-list/create-profile"
              element={<FormElements />}
            />
            <Route path="/employee-list/:id" element={<EmployeeDetail />} />
          </Route>
        </Route>

        {/* ---------- HR ROUTES ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["HR_MANAGER"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/attendence-check" element={<EmployeeAttendence />} />
            <Route
              path="/attendence-history"
              element={<EditAttendenceHistory />}
            />
            <Route path="/attendence-report" element={<AttendenceReport />} />
            <Route path="/highlight-report" element={<HighlightReport />} />
            <Route path="/list-notification" element={<ListNotification />} />
            <Route path="/employee-list" element={<EmployeeList />} />
            <Route
              path="/employee-list/create-profile"
              element={<FormElements />}
            />
            <Route path="/employee-list/:id" element={<EmployeeDetail />} />
           
          </Route>
        </Route>

        
          
        {/* ---------- FALLBACK ---------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
