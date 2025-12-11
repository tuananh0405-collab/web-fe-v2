import { useState } from "react";
import { Link } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useDispatch } from "react-redux";
import { useSignInMutation } from "../../redux/api/authApiSlice";
import { setCredentials } from "../../redux/features/authSlice";
import { useNavigate } from "react-router-dom";
import Alert from "../ui/alert/Alert";

type Errors = {
  email?: string;
  password?: string;
};

export default function SignInForm() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [signIn, { isLoading }] = useSignInMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<
    null | { type: "success" | "error"; message: string }
  >(null);

  const validate = () => {
    const newErrors: Errors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const response = await signIn({ email, password }).unwrap();
      dispatch(setCredentials({ data: response.data }));

      // Nếu muốn hiện alert success rồi redirect thì có thể delay,
      // còn ở đây redirect luôn.
      if (response.data.user.role === "ADMIN") navigate("/");
      else if (response.data.user.role === "HR_MANAGER")
        navigate("/attendence-report");
      else if (response.data.user.role === "DEPARTMENT_MANAGER")
        navigate("/employee-schedule");
      else navigate("/");

    } catch (err: any) {
      console.error("Login failed:", err);
      const message =
        err?.data?.message ||
        err?.error ||
        "Login failed. Please check your email or password.";
      setAlert({ type: "error", message });
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto" />

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* Alert lỗi đăng nhập */}
          {alert && (
            <div className="mb-4">
              <Alert
                variant={alert.type}
                title={alert.type === "success" ? "Success" : "Login failed"}
                message={alert.message}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>{" "}
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  type="email"
                  error={!!errors.email}
                  hint={errors.email}
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>{" "}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    error={!!errors.password}
                    hint={errors.password}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              <div>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
