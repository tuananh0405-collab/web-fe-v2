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
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import { ScrollToTop } from "./components/common/ScrollToTop";
import UserAccountDetail from "./pages/SystemConfiguration/UserAccountDetail";

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ---------- AUTH ---------- */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* ---------- ADMIN ROUTES ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/department-config" element={<DepartmentConfig />} />
            <Route path="/user-account-config" element={<UserAccountConfig />} />
            <Route path="/user-account-config/:id" element={<UserAccountDetail />} />
            <Route path="/attribute-config" element={<AttributeConfig />} />
            <Route path="/device-request" element={<DeviceRequest />} />
            <Route path="/device-request/pending" element={<PendingDevices />} />
            <Route path="/faceid-request" element={<FaceIDRequest />} />
          </Route>
        </Route>

        {/* ---------- HR ROUTES ---------- */}
        <Route element={<ProtectedRoute allowedRoles={["HR_ADMIN", "SUPER_ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/attendence-check" element={<EmployeeAttendence />} />
            <Route path="/attendence-history" element={<EditAttendenceHistory />} />
            <Route path="/employee-schedule" element={<EmployeeSchedule />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/shifts" element={<Shifts />} />
            <Route path="/overtimes" element={<Overtimes />} />
            <Route path="/attendence-report" element={<AttendenceReport />} />
            <Route path="/highlight-report" element={<HighlightReport />} />
            <Route path="/list-notification" element={<ListNotification />} />
            <Route path="/employee-list" element={<BasicTables />} />
            <Route path="/employee-list/create-profile" element={<FormElements />} />
            <Route path="/employee-list/profile-detail" element={<UserProfiles />} />
          </Route>
        </Route>

        {/* ---------- FALLBACK ---------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
